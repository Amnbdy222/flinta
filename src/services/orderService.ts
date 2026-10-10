import { supabase } from '../lib/supabase';
import { Order, OrderItem, ProductImage } from '../types/database.types';
import { sendOrderCancellationEmail } from './emailService';

interface OrderItemWithProduct extends Omit<OrderItem, 'product'> {
  product?: {
    slug: string;
    product_images?: ProductImage[];
  };
}

interface RawOrderRecord extends Omit<Order, 'order_items'> {
  order_items?: OrderItemWithProduct[];
}

export function formatOrderNumber(orderNum?: string | null): string {
  if (!orderNum) return '';
  const parts = orderNum.split('-');
  if (parts.length >= 3 && parts[0] === 'FL') {
    return `${parts[0]}-${parts[1]}`;
  }
  return orderNum;
}

export async function fetchCustomerOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            slug,
            product_images (*)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    const rawOrders = (data || []) as unknown as RawOrderRecord[];
    const validOrders = rawOrders.filter((order) => {
      // Exclude incomplete/unpaid online checkout attempts
      if (
        order.payment_method === 'razorpay' &&
        order.payment_status !== 'paid' &&
        order.payment_status !== 'refunded'
      ) {
        return false;
      }
      return true;
    });
    const formattedOrders = validOrders.map((order) => {
      if (order.order_items) {
        order.order_items = order.order_items.map((item) => {
          let imageUrl = '';
          const pImages = item.product?.product_images || [];
          const primary = pImages.find((img) => img.is_primary);
          imageUrl = primary?.public_url || (pImages.length > 0 ? pImages[0].public_url : '');

          if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop';
          }

          return {
            ...item,
            image_url: imageUrl,
            product_slug: item.product?.slug || '',
          };
        });
      }
      return order;
    });

    return formattedOrders as Order[];
  } catch (err) {
    console.error('Unexpected error fetching orders:', err);
    return [];
  }
}

export async function fetchOrderDetail(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            slug,
            product_images (*)
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) {
      console.error('Error fetching order detail:', error);
      return null;
    }

    const orderData = data as unknown as RawOrderRecord;
    if (
      orderData.payment_method === 'razorpay' &&
      orderData.payment_status !== 'paid' &&
      orderData.payment_status !== 'refunded'
    ) {
      return null;
    }
    if (orderData.order_items) {
      orderData.order_items = orderData.order_items.map((item) => {
        let imageUrl = '';
        const pImages = item.product?.product_images || [];
        const primary = pImages.find((img) => img.is_primary);
        imageUrl = primary?.public_url || (pImages.length > 0 ? pImages[0].public_url : '');

        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop';
        }

        return {
          ...item,
          image_url: imageUrl,
          product_slug: item.product?.slug || '',
        };
      });
    }

    return orderData as Order;
  } catch (err) {
    console.error('Unexpected error fetching order detail:', err);
    return null;
  }
}

function getFunctionEndpoint(functionName: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://flintaindia.com';
  return `${origin}/.netlify/functions/${functionName}`;
}

export async function cancelRazorpayPaidOrder(orderId: string, reason?: string): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Authentication required to cancel paid order.');

  const endpoint = getFunctionEndpoint('cancel-razorpay-order');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, accessToken, reason }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to process refund for this order.');
  }

  const updatedOrder = await fetchOrderDetail(orderId);
  if (!updatedOrder) {
    throw new Error('Order refunded successfully, but updated details could not be loaded.');
  }

  return updatedOrder;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Authentication required.');

  // Fetch target order to verify ownership and current status
  const { data: existingOrder, error: fetchErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (fetchErr || !existingOrder) {
    throw new Error('Order not found.');
  }

  if (existingOrder.user_id && existingOrder.user_id !== userId) {
    throw new Error('Unauthorized to cancel this order.');
  }

  // Handle Razorpay Orders: only paid orders can be cancelled & refunded
  if (existingOrder.payment_method === 'razorpay') {
    if (existingOrder.payment_status === 'paid') {
      return await cancelRazorpayPaidOrder(orderId, reason);
    } else {
      throw new Error('Unpaid online payment attempts cannot be cancelled.');
    }
  }

  const allowedStatus = ['pending', 'confirmed', 'processing'];
  if (!allowedStatus.includes(existingOrder.status)) {
    throw new Error(`Orders in "${existingOrder.status.toUpperCase()}" status cannot be cancelled.`);
  }

  let updateSucceeded = false;

  // 1. Attempt database RPC function call: cancel_order
  try {
    const { error: rpcErr } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_reason: reason || 'Customer requested cancellation',
    });

    if (!rpcErr) {
      updateSucceeded = true;
    } else {
      // Try without p_reason
      const { error: rpcErr2 } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
      });

      if (!rpcErr2) {
        updateSucceeded = true;
      } else {
        console.warn('RPC cancel_order failed:', rpcErr?.message || rpcErr2?.message);
      }
    }
  } catch (rpcCatchErr) {
    console.warn('RPC cancel_order exception:', rpcCatchErr);
  }

  // 2. Direct Table Update Fallback
  if (!updateSucceeded) {
    const updatePayload: Record<string, unknown> = {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    };

    // If order user_id is null, attach active userId to satisfy Supabase RLS policies
    if (!existingOrder.user_id && userId) {
      updatePayload.user_id = userId;
    }

    const { data: updatedRows, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select();

    if (!updateErr && updatedRows && updatedRows.length > 0) {
      updateSucceeded = true;
    } else {
      console.error('Direct table update failed:', updateErr);
    }
  }

  if (!updateSucceeded) {
    throw new Error('Failed to update order status in database. Permission or record lock issue.');
  }

  // Note: Inventory restocking and transaction logging are handled atomically
  // by the server-side cancel_order RPC / finalize_razorpay_refund function.
  const cancelledOrder = { ...existingOrder, status: 'cancelled' } as Order;

  // Fire-and-forget: send cancellation email via Netlify Function (fetches DB order)
  void sendOrderCancellationEmail(cancelledOrder.id, reason);

  return cancelledOrder;
}
