import type { Handler } from '@netlify/functions';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

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

  // Strict check: Environment variables must be configured on backend server
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not configured in environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Razorpay backend payment service not configured in server environment variables.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, accessToken } = body as { orderId: string; accessToken: string };

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId parameter.' }) };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing user authentication token.' }) };
    }

    // 1. Authenticate user session
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      console.error('User authentication verification failed:', authErr);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized user token.' }) };
    }

    // 2. Fetch server-authoritative order details from database
    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

    const { data: order, error: orderErr } = await dbClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.error('Failed to fetch order from database:', orderErr);
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order record not found in database.' }) };
    }

    // Verify order ownership
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized order ownership access.' }) };
    }

    // Calculate server-authoritative amount in paise (e.g. ₹999.00 -> 99900 paise)
    const totalAmount = Number(order.total_amount) || 0;
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise < 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Order total amount must be at least ₹1.00 (100 paise).' }),
      };
    }

    // 3. Create Razorpay order via Razorpay SDK
    const instance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: String(order.order_number || `FL-${Date.now()}`),
      notes: {
        flint_order_id: order.id,
        flint_order_number: order.order_number || '',
        user_id: user.id,
      },
    };

    const razorpayOrder = await instance.orders.create(options);

    // 4. Update order with razorpay_order_id in database
    await dbClient
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order_id: razorpayOrder.id,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      }),
    };
  } catch (err: any) {
    console.error('create-razorpay-order handler error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Internal server error while creating Razorpay order.' }),
    };
  }
};
