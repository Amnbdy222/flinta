import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { processShiprocketOrderForOrder } from './_shiprocket-client';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';

/**
 * Netlify Function: create-shipment
 *
 * Creates or synchronizes an order with Shiprocket.
 * Can be called automatically after COD checkout or by admin.
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

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
