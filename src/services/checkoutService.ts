import { supabase } from '../lib/supabase';
import { Order } from '../types/database.types';
import { ensureProfileExists } from './authService';
import {
  getOrCreateActiveCart,
  getLocalGuestCartItems,
  clearLocalGuestCartItems,
  addItemToCart,
} from './cartService';
import { sendOrderConfirmationEmail } from './emailService';

export type PaymentMethodType = 'cod' | 'razorpay';

export interface ShippingDetails {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
}

// Validate standard 36-character UUID format
function isValidUUID(str: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Place a Cash-on-Delivery order via the server-side place_cod_order RPC.
 *
 * The RPC is SECURITY DEFINER and handles the ENTIRE transaction atomically:
 *   authenticate → validate cart → lock cart → validate items → lock variants
 *   → calculate subtotal → validate coupon → calculate discount → calculate total
 *   → INSERT order → INSERT order_items → decrement stock → INSERT coupon_usage
 *   → convert cart → COMMIT
 *
 * The frontend sends ONLY the coupon CODE (not discount amounts or totals).
 * The server calculates everything from database-authoritative prices.
 */
export async function placeOrderCOD(
  cartId: string,
  shippingDetails: ShippingDetails,
  couponCode?: string | null,
  options?: { sendEmail?: boolean }
): Promise<Order> {
  // 1. Get active authenticated user session
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData?.session || !sessionData.session.user) {
    throw new Error('Please sign in to continue checkout.');
  }

  const user = sessionData.session.user;
  const userId = user.id;

  // Ensure matching profile record exists for foreign key constraint
  await ensureProfileExists(userId, shippingDetails.full_name, shippingDetails.phone);

  // 2. Resolve Valid Supabase Cart UUID (Sync guest local items to DB cart if needed)
  let targetCartId = cartId;

  if (!isValidUUID(targetCartId)) {
    const dbCart = await getOrCreateActiveCart();
    targetCartId = dbCart.id;

    const localGuestItems = getLocalGuestCartItems();
    if (localGuestItems.length > 0 && isValidUUID(targetCartId)) {
      for (const item of localGuestItems) {
        try {
          await addItemToCart(targetCartId, item.variant_id, item.quantity);
        } catch (mErr) {
          console.warn('Cart item sync warning during checkout:', mErr);
        }
      }
      clearLocalGuestCartItems();
    }
  }

  if (!isValidUUID(targetCartId)) {
    throw new Error('Unable to resolve active cart session. Please try adding items to your bag again.');
  }

  const cleanCode = couponCode?.trim().toUpperCase() || null;

  const { data: rpcData, error: rpcErr } = await supabase.rpc('place_cod_order', {
    p_cart_id: targetCartId,
    p_guest_session_id: '',
    p_shipping_name: shippingDetails.full_name.trim(),
    p_shipping_phone: shippingDetails.phone.trim(),
    p_shipping_address_line_1: shippingDetails.address_line_1.trim(),
    p_shipping_address_line_2: shippingDetails.address_line_2?.trim() || '',
    p_shipping_city: shippingDetails.city.trim(),
    p_shipping_state: shippingDetails.state.trim(),
    p_shipping_pincode: shippingDetails.pincode.trim(),
    p_coupon_code: cleanCode,
  });

  if (rpcErr) {
    console.error('place_cod_order RPC error:', rpcErr);
    const msg = rpcErr.message || 'Failed to create order.';

    if (
      msg.includes('already been converted') ||
      msg.includes('already been processed')
    ) {
      throw new Error('Your order has already been placed.');
    }
    throw new Error(msg);
  }

  if (!rpcData) {
    throw new Error('Order creation returned no data. Please try again.');
  }

  const orderData = rpcData as Record<string, unknown>;

  const createdOrder: Order = {
    id: String(orderData.id || ''),
    order_number: String(orderData.order_number || ''),
    user_id: String(orderData.user_id || ''),
    status: (orderData.status as Order['status']) || 'pending',
    payment_method: (orderData.payment_method as Order['payment_method']) || 'cod',
    payment_status: (orderData.payment_status as Order['payment_status']) || 'pending',
    subtotal: Number(orderData.subtotal) || 0,
    discount_amount: Number(orderData.discount_amount) || 0,
    shipping_amount: Number(orderData.shipping_amount) || 0,
    total_amount: Number(orderData.total_amount) || 0,
    coupon_id: orderData.coupon_id ? String(orderData.coupon_id) : null,
    shipping_name: String(orderData.shipping_name || ''),
    shipping_phone: String(orderData.shipping_phone || ''),
    shipping_address_line_1: String(orderData.shipping_address_line_1 || ''),
    shipping_address_line_2: orderData.shipping_address_line_2 ? String(orderData.shipping_address_line_2) : null,
    shipping_city: String(orderData.shipping_city || ''),
    shipping_state: String(orderData.shipping_state || ''),
    shipping_pincode: String(orderData.shipping_pincode || ''),
    created_at: String(orderData.created_at || new Date().toISOString()),
    updated_at: String(orderData.updated_at || new Date().toISOString()),
  };

  clearLocalGuestCartItems();

  // Send order confirmation email only if sendEmail is true (Default: true for COD, false for Razorpay until payment verified)
  const shouldSendEmail = options?.sendEmail !== false;
  if (shouldSendEmail) {
    void sendOrderConfirmationEmail(createdOrder.id, shippingDetails.email);
  }

  // Trigger automated Shiprocket courier booking for COD
  triggerShiprocketShipment(createdOrder.id, shippingDetails.email);

  return createdOrder;
}

export function triggerShiprocketShipment(orderId: string, customerEmail?: string): void {
  const endpoint =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://flintaindia.com/.netlify/functions/create-shipment'
      : '/.netlify/functions/create-shipment';

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, customerEmail }),
  }).catch((err) => {
    console.warn('[checkoutService] Shiprocket background trigger warning:', err);
  });
}

/**
 * Create a pending Razorpay order via the server-side create_razorpay_pending_order RPC.
 *
 * The RPC creates the pending order row & order_items snapshots in DB.
 * It DOES NOT deduct stock, DOES NOT send email, and DOES NOT convert the cart.
 * The cart remains active until payment signature is verified.
 */
export async function createRazorpayPendingOrder(
  cartId: string,
  shippingDetails: ShippingDetails,
  couponCode?: string | null
): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;

  if (!sessionUser) {
    throw new Error('Authentication required. Please sign in to place an order.');
  }

  await ensureProfileExists(sessionUser.id, sessionUser.email, sessionUser.user_metadata?.full_name);

  // Resolve Valid Supabase Cart UUID (Sync guest local items to DB cart if needed)
  let targetCartId = cartId;

  if (!isValidUUID(targetCartId)) {
    const dbCart = await getOrCreateActiveCart();
    targetCartId = dbCart.id;

    const localGuestItems = getLocalGuestCartItems();
    if (localGuestItems.length > 0 && isValidUUID(targetCartId)) {
      for (const item of localGuestItems) {
        try {
          await addItemToCart(targetCartId, item.variant_id, item.quantity);
        } catch (mErr) {
          console.warn('Cart item sync warning during Razorpay checkout:', mErr);
        }
      }
      clearLocalGuestCartItems();
    }
  }

  if (!isValidUUID(targetCartId)) {
    throw new Error('Unable to resolve active cart session. Please refresh and try again.');
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc('create_razorpay_pending_order', {
    p_cart_id: targetCartId,
    p_shipping_name: shippingDetails.full_name,
    p_shipping_phone: shippingDetails.phone,
    p_shipping_address_line_1: shippingDetails.address_line_1,
    p_shipping_address_line_2: shippingDetails.address_line_2 || '',
    p_shipping_city: shippingDetails.city,
    p_shipping_state: shippingDetails.state,
    p_shipping_pincode: shippingDetails.pincode,
    p_coupon_code: couponCode || null,
  });

  if (rpcErr) {
    console.error('create_razorpay_pending_order RPC error:', rpcErr);
    throw new Error(rpcErr.message || 'Failed to create Razorpay pending order.');
  }

  if (!rpcData) {
    throw new Error('Pending order creation returned no data. Please try again.');
  }

  const orderData = rpcData as Record<string, unknown>;

  const createdOrder: Order = {
    id: String(orderData.id || ''),
    order_number: String(orderData.order_number || ''),
    user_id: String(orderData.user_id || ''),
    status: (orderData.status as Order['status']) || 'pending',
    payment_method: 'razorpay',
    payment_status: 'pending',
    subtotal: Number(orderData.subtotal) || 0,
    discount_amount: Number(orderData.discount_amount) || 0,
    shipping_amount: Number(orderData.shipping_amount) || 0,
    total_amount: Number(orderData.total_amount) || 0,
    coupon_id: orderData.coupon_id ? String(orderData.coupon_id) : null,
    shipping_name: String(orderData.shipping_name || ''),
    shipping_phone: String(orderData.shipping_phone || ''),
    shipping_address_line_1: String(orderData.shipping_address_line_1 || ''),
    shipping_address_line_2: orderData.shipping_address_line_2 ? String(orderData.shipping_address_line_2) : null,
    shipping_city: String(orderData.shipping_city || ''),
    shipping_state: String(orderData.shipping_state || ''),
    shipping_pincode: String(orderData.shipping_pincode || ''),
    stock_deducted: false,
    confirmation_email_sent: false,
    created_at: String(orderData.created_at || new Date().toISOString()),
    updated_at: String(orderData.updated_at || new Date().toISOString()),
  };

  return createdOrder;
}
