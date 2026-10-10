import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';

/**
 * Netlify Function: shiprocket-webhook
 *
 * Receives automated real-time tracking events from Shiprocket.
 * Updates order status (e.g. shipped, out_for_delivery, delivered) in Supabase.
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Support preflight / OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // Support GET / HEAD health-checks
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'healthy', message: 'Webhook live' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Accepted' }) };
  }

  // Verify webhook secret token if configured
  const incomingToken =
    event.headers['x-api-key'] ||
    event.headers['x-shiprocket-token'] ||
    event.headers['authorization'];
  const configuredSecret = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.SHIPROCKET_WEBHOOK_TOKEN;

  if (configuredSecret && incomingToken !== configuredSecret && incomingToken !== `Bearer ${configuredSecret}`) {
    console.warn('[ShiprocketWebhook] Unauthorized webhook invocation attempt.');
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized webhook request' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('[ShiprocketWebhook] Received event:', JSON.stringify(payload));

    const awb = payload.awb || payload.awb_code;
    const currentStatus = String(payload.current_status || payload.status || '').toUpperCase();
    const orderId = payload.order_id;
    const courierName = payload.courier_name;

    if (!awb && !orderId) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Test ping acknowledged' }) };
    }

    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Find order by awb_code or order_number or shiprocket_order_id
    let query = dbClient.from('orders').select('id, status, shipment_status, payment_method, payment_status');
    if (awb) {
      query = query.eq('awb_code', awb);
    } else if (orderId) {
      query = query.or(`order_number.eq.${orderId},shiprocket_order_id.eq.${orderId}`);
    }

    const { data: orders, error: findErr } = await query;
    if (findErr || !orders || orders.length === 0) {
      console.warn(`[ShiprocketWebhook] No matching order found for AWB: ${awb}, orderId: ${orderId}`);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, matched: false }) };
    }

    const targetOrder = orders[0];

    // Map Shiprocket status to Store OrderStatus
    let newStatus: string | null = null;
    if (currentStatus.includes('DELIVERED')) {
      newStatus = 'delivered';
    } else if (currentStatus.includes('OUT FOR DELIVERY')) {
      newStatus = 'out_for_delivery';
    } else if (currentStatus.includes('IN TRANSIT') || currentStatus.includes('SHIPPED') || currentStatus.includes('PICKED UP')) {
      newStatus = 'shipped';
    }

    const updateData: Record<string, any> = {
      shipment_status: currentStatus.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    if (newStatus && targetOrder.status !== 'delivered') {
      updateData.status = newStatus;
    }

    // When a COD order is DELIVERED, customer paid cash -> mark payment_status = 'paid'
    if (newStatus === 'delivered' && targetOrder.payment_method === 'cod') {
      updateData.payment_status = 'paid';
    }

    if (courierName) {
      updateData.courier_name = courierName;
    }

    if (awb) {
      updateData.tracking_url = `https://shiprocket.co/tracking/${awb}`;
    }

    const { error: updateErr } = await dbClient
      .from('orders')
      .update(updateData)
      .eq('id', targetOrder.id);

    if (updateErr) {
      console.error(`[ShiprocketWebhook] Order update failed:`, updateErr.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: updateErr.message }) };
    }

    console.log(`[ShiprocketWebhook] Updated order ${targetOrder.id} status to "${newStatus || targetOrder.status}" (Shipment: ${currentStatus})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, orderId: targetOrder.id, status: newStatus }),
    };
  } catch (err: any) {
    console.error('[ShiprocketWebhook] Handler error:', err?.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
};
