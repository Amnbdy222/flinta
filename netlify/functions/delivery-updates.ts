import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';

/**
 * Netlify Function: delivery-updates
 * 
 * Webhook callback for courier tracking updates.
 * URL avoids restricted keywords (shiprocket, kartrocket, sr, kr) required by courier platforms.
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Support preflight / OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // Support GET / HEAD health-checks from webhook validation tools
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        endpoint: 'delivery-updates',
        message: 'Courier webhook endpoint is live and accepting events.',
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Accepted' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('[DeliveryWebhook] Received event:', JSON.stringify(payload));

    const awb = payload.awb || payload.awb_code;
    const currentStatus = String(payload.current_status || payload.status || '').toUpperCase();
    const orderId = payload.order_id;
    const courierName = payload.courier_name;

    // Handle initial test pings / verification requests from webhook setup
    if (!awb && !orderId) {
      console.log('[DeliveryWebhook] Acknowledged test ping (no AWB/order_id provided).');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Webhook test ping received successfully.',
        }),
      };
    }

    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Find order by awb_code or order_number or shiprocket_order_id
    const filters: string[] = [];
    if (awb) filters.push(`awb_code.eq.${awb}`);
    if (orderId) {
      filters.push(`order_number.eq.${orderId}`);
      filters.push(`shiprocket_order_id.eq.${orderId}`);
    }
    if (payload.sr_order_id) {
      filters.push(`shiprocket_order_id.eq.${payload.sr_order_id}`);
    }

    if (filters.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, matched: false }) };
    }

    const { data: orders, error: findErr } = await dbClient
      .from('orders')
      .select('id, status, shipment_status, payment_method, payment_status')
      .or(filters.join(','));

    if (findErr || !orders || orders.length === 0) {
      console.warn(`[DeliveryWebhook] No matching order found for AWB: ${awb}, orderId: ${orderId}`);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, matched: false }) };
    }

    const targetOrder = orders[0];

    // Map courier status to Store OrderStatus
    let newStatus: string | null = null;
    if (currentStatus.includes('DELIVERED')) {
      newStatus = 'delivered';
    } else if (currentStatus.includes('OUT FOR DELIVERY')) {
      newStatus = 'out_for_delivery';
    } else if (
      currentStatus.includes('IN TRANSIT') ||
      currentStatus.includes('SHIPPED') ||
      currentStatus.includes('PICKED UP')
    ) {
      newStatus = 'shipped';
    }

    const updateData: Record<string, any> = {
      shipment_status: currentStatus.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    if (newStatus && targetOrder.status !== 'delivered') {
      updateData.status = newStatus;
    }

    // When a COD order is DELIVERED, the delivery boy has collected cash!
    // Automatically transition payment_status from 'pending' to 'paid'.
    if (newStatus === 'delivered' && targetOrder.payment_method === 'cod') {
      updateData.payment_status = 'paid';
    }

    if (courierName) {
      updateData.courier_name = courierName;
    }

    if (awb) {
      updateData.awb_code = awb;
      updateData.tracking_url = `https://shiprocket.co/tracking/${awb}`;
    }

    const { error: updateErr } = await dbClient
      .from('orders')
      .update(updateData)
      .eq('id', targetOrder.id);

    if (updateErr) {
      console.error(`[DeliveryWebhook] Order update failed:`, updateErr.message);
      // Return 200 to courier so it doesn't repeatedly retry on internal db edge cases
      return { statusCode: 200, headers, body: JSON.stringify({ error: updateErr.message, received: true }) };
    }

    console.log(
      `[DeliveryWebhook] Updated order ${targetOrder.id} status to "${newStatus || targetOrder.status}" (Shipment: ${currentStatus})`
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, orderId: targetOrder.id, status: newStatus }),
    };
  } catch (err: any) {
    console.error('[DeliveryWebhook] Handler error:', err?.message || err);
    // Return 200 on parse or minor errors so courier validation succeeds
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, warning: 'Invalid JSON or test payload acknowledged.' }),
    };
  }
};
