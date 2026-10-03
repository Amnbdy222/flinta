import { SupabaseClient } from '@supabase/supabase-js';

const SHIPROCKET_AUTH_URL = 'https://apiv2.shiprocket.in/v1/external/auth/login';
const SHIPROCKET_CREATE_ORDER_URL = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc';
const SHIPROCKET_ASSIGN_AWB_URL = 'https://apiv2.shiprocket.in/v1/external/courier/assign/awb';
const SHIPROCKET_TRACK_AWB_URL = 'https://apiv2.shiprocket.in/v1/external/courier/track/awb';

// In-memory token cache (reused across warm serverless function instances)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtain a valid JWT authentication token from Shiprocket.
 * Caches the token for 9 days (Shiprocket tokens expire in 10 days).
 */
export async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is not configured.');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(SHIPROCKET_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Shiprocket auth failed (Status ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { token: string };
  if (!data?.token) {
    throw new Error('Shiprocket auth response missing token.');
  }

  cachedToken = data.token;
  // Expire cache in 9 days (777600000 ms)
  tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

export interface ShiprocketOrderItemPayload {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketOrderResult {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

/**
 * Format order date as "YYYY-MM-DD HH:mm" as required by Shiprocket
 */
function formatShiprocketDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Create an Adhoc Order in Shiprocket
 */
export async function createShiprocketOrder(
  order: Record<string, any>,
  orderItems: Record<string, any>[]
): Promise<ShiprocketOrderResult> {
  const token = await getShiprocketToken();
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse-1';

  // Map order items for Shiprocket
  const items: ShiprocketOrderItemPayload[] = (orderItems || []).map((item, idx) => ({
    name: String(item.product_name_snapshot || `Item ${idx + 1}`),
    sku: String(item.sku_snapshot || item.variant_id || `SKU-${idx + 1}`).slice(0, 50),
    units: Math.max(1, Number(item.quantity) || 1),
    selling_price: Math.max(1, Number(item.unit_price) || Number(order.total_amount) || 1),
    discount: 0,
    tax: 0,
  }));

  if (items.length === 0) {
    items.push({
      name: 'Flint Apparel Garment',
      sku: 'FLINT-DEFAULT-SKU',
      units: 1,
      selling_price: Math.max(1, Number(order.total_amount) || 1),
    });
  }

  // Customer Name splitting
  const fullName = String(order.shipping_name || 'Customer').trim();
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '';

  const isCOD = String(order.payment_method).toLowerCase() === 'cod';
  const totalAmount = Math.max(1, Number(order.total_amount) || 0);

  const payload = {
    order_id: String(order.order_number || order.id),
    order_date: formatShiprocketDate(order.created_at),
    pickup_location: pickupLocation,
    channel_id: '',
    comment: `Flint Order #${order.order_number || ''}`,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: String(order.shipping_address_line_1 || 'Address Line 1'),
    billing_address_2: String(order.shipping_address_line_2 || ''),
    billing_city: String(order.shipping_city || 'City'),
    billing_pincode: String(order.shipping_pincode || '110001'),
    billing_state: String(order.shipping_state || 'Delhi'),
    billing_country: 'India',
    billing_email: String(order.shipping_email || 'orders@flintaindia.com'),
    billing_phone: String(order.shipping_phone || '9999999999').replace(/[^0-9]/g, '').slice(-10),
    shipping_is_billing: true,
    order_items: items,
    payment_method: isCOD ? 'COD' : 'Prepaid',
    sub_total: totalAmount,
    length: 25, // Standard apparel box cm
    breadth: 20,
    height: 5,
    weight: 0.5, // 500 grams default apparel package
  };

  console.log(`[Shiprocket] Creating order for #${payload.order_id} (Pickup: ${pickupLocation}, Payment: ${payload.payment_method})`);

  const res = await fetch(SHIPROCKET_CREATE_ORDER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok || !resData.order_id) {
    const msg = resData.message || JSON.stringify(resData);
    throw new Error(`Shiprocket order creation failed (Status ${res.status}): ${msg}`);
  }

  console.log(`[Shiprocket] Order created! Shiprocket Order ID: ${resData.order_id}, Shipment ID: ${resData.shipment_id}`);
  return resData as ShiprocketOrderResult;
}

/**
 * Assign a courier partner and generate an AWB tracking number for a shipment.
 */
export async function assignCourierAndGenerateAWB(
  shipmentId: number
): Promise<{ awb_code: string; courier_name: string }> {
  const token = await getShiprocketToken();

  const res = await fetch(SHIPROCKET_ASSIGN_AWB_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: shipmentId }),
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`[Shiprocket] AWB assignment returned status ${res.status}:`, resData);
    throw new Error(`Shiprocket AWB assignment failed: ${resData.message || 'Unknown error'}`);
  }

  const responsePayload = resData.response?.data || resData;
  const awbCode = responsePayload.awb_code || '';
  const courierName = responsePayload.courier_name || '';

  return { awb_code: awbCode, courier_name: courierName };
}

/**
 * Fetch real-time live tracking data for an AWB code.
 */
export async function trackShipmentByAWB(awbCode: string): Promise<any> {
  const token = await getShiprocketToken();

  const res = await fetch(`${SHIPROCKET_TRACK_AWB_URL}/${encodeURIComponent(awbCode)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Shiprocket tracking fetch failed (Status ${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Main automated worker function:
 * Checks order status, creates Shiprocket order, requests courier assignment,
 * and records all IDs, AWB tracking code, and tracking URL in Supabase.
 */
export async function processShiprocketOrderForOrder(
  dbClient: SupabaseClient,
  orderId: string
): Promise<void> {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    console.log('[Shiprocket] Credentials not configured. Skipping automated shipping.');
    return;
  }

  try {
    // 1. Fetch order details with order_items
    const { data: order, error: orderErr } = await dbClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.warn(`[Shiprocket] Order ${orderId} not found in DB:`, orderErr?.message);
      return;
    }

    // 2. Prevent duplicate shipment creation if already created
    if (order.shiprocket_order_id) {
      console.log(`[Shiprocket] Order ${orderId} already has Shiprocket Order ID: ${order.shiprocket_order_id}. Skipping.`);
      return;
    }

    // 3. Create order in Shiprocket
    const srResult = await createShiprocketOrder(order, order.order_items || []);

    const srOrderId = String(srResult.order_id);
    const srShipmentId = String(srResult.shipment_id || '');

    let awbCode = srResult.awb_code || '';
    let courierName = srResult.courier_name || '';

    // 4. Try auto-assigning courier partner and AWB if shipment ID is present
    if (srResult.shipment_id && !awbCode) {
      try {
        const awbResult = await assignCourierAndGenerateAWB(srResult.shipment_id);
        if (awbResult.awb_code) {
          awbCode = awbResult.awb_code;
          courierName = awbResult.courier_name;
        }
      } catch (awbErr: any) {
        console.warn(`[Shiprocket] Note: Could not auto-assign AWB immediately for shipment ${srResult.shipment_id}:`, awbErr?.message);
      }
    }

    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;

    // 5. Update Supabase order record
    const updatePayload: Record<string, any> = {
      shiprocket_order_id: srOrderId,
      shiprocket_shipment_id: srShipmentId,
      courier_name: courierName || null,
      awb_code: awbCode || null,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString(),
    };

    if (awbCode) {
      updatePayload.status = 'processing';
      updatePayload.shipment_status = 'awb_assigned';
    }

    const { error: updateErr } = await dbClient
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      console.warn(`[Shiprocket] Database update failed for order ${orderId}:`, updateErr.message);
    } else {
      console.log(`[Shiprocket] Order ${orderId} successfully synced with Shiprocket! AWB: ${awbCode || 'Pending'}`);
    }
  } catch (err: any) {
    console.error(`[Shiprocket] Automated order processing error for ${orderId}:`, err?.message || err);
  }
}
