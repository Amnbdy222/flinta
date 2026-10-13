import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { processShiprocketOrderForOrder } from './_shiprocket-client';
import { getSecureCorsHeaders, handleCorsPreflight, getRequiredEnv } from './_security';

/**
 * Netlify Function: create-shipment
 *
 * Creates or synchronizes an order with Shiprocket.
 * Can be called automatically after COD checkout or by admin.
 */
export const handler: Handler = async (event) => {
  const preflight = handleCorsPreflight(event);
  if (preflight) return preflight;

  const headers = getSecureCorsHeaders(event);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Strict environment variable resolution (zero hardcoded fallbacks) ──
  let SUPABASE_URL: string;
  let SUPABASE_ANON_KEY: string;
  try {
    SUPABASE_URL = getRequiredEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
    SUPABASE_ANON_KEY = getRequiredEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
  } catch (cfgErr: any) {
    console.error('[create-shipment] Config error:', cfgErr.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, customerEmail } = body;

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId' }) };
    }

    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Verify order existence and current state
    const { data: existingOrder, error: fetchErr } = await dbClient
      .from('orders')
      .select('id, status, payment_status, payment_method, shiprocket_order_id, shiprocket_shipment_id, courier_name, awb_code, tracking_url')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !existingOrder) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found.' }) };
    }

    // 2. Prevent shipment creation for cancelled or invalid orders
    if (existingOrder.status === 'cancelled') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cannot create shipment for a cancelled order.' }) };
    }

    // 3. For Razorpay, payment MUST be confirmed as paid before shipping
    if (existingOrder.payment_method === 'razorpay' && existingOrder.payment_status !== 'paid') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Cannot ship unpaid online order. Payment status is "${existingOrder.payment_status}".` }),
      };
    }

    // 4. If already created on Shiprocket, return safely (idempotent)
    if (existingOrder.shiprocket_order_id) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Shipment already exists for this order.',
          order: existingOrder,
        }),
      };
    }

    await processShiprocketOrderForOrder(dbClient, orderId, customerEmail);

    // Fetch updated order info
    const { data: order } = await dbClient
      .from('orders')
      .select('id, shiprocket_order_id, shiprocket_shipment_id, courier_name, awb_code, tracking_url')
      .eq('id', orderId)
      .single();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order,
      }),
    };
  } catch (err: any) {
    console.error('[create-shipment] Error:', err?.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Failed to create shipment' }),
    };
  }
};
