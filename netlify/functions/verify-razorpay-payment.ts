import type { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '../../src/services/emailService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

  if (!RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET is not configured in server environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Razorpay secret is not configured in server environment variables.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      accessToken,
    } = body as {
      orderId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
      accessToken: string;
    };

    if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields (orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature).',
        }),
      };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing access token.' }) };
    }

    // 1. Authenticate user identity
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      console.error('Auth verification failed during payment verification:', authErr);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized user token.' }) };
    }

    // 2. Fetch order from database and verify ownership & Razorpay Order ID match
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
      console.error('Order not found for verification:', orderErr);
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order record not found.' }) };
    }

    // Verify order ownership
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized access to order.' }) };
    }

    // Verify razorpay_order_id matches if recorded in database
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      console.warn('Razorpay order ID mismatch:', { dbOrderId: order.razorpay_order_id, rzpOrderId: razorpay_order_id });
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Razorpay Order ID mismatch for this order.' }) };
    }

    // 3. Compute and verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn('Signature verification mismatch:', { generatedSignature, razorpay_signature });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid Razorpay payment signature. Verification failed.' }),
      };
    }

    // 4. Server-authoritative update of database order state to PAID and PROCESSING
    const { error: updateErr } = await dbClient
      .from('orders')
      .update({
        payment_method: 'razorpay',
        payment_status: 'paid',
        status: 'processing',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      console.error('Failed to update order status in database after verification:', updateErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update order in database.' }) };
    }

    // 5. Send order confirmation email after payment confirmed
    try {
      await sendOrderConfirmationEmail(orderId);
    } catch (eErr) {
      console.warn('Non-blocking order email trigger notice:', eErr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Razorpay payment verified successfully.',
        orderId: order.id,
        orderNumber: order.order_number,
      }),
    };
  } catch (err: any) {
    console.error('verify-razorpay-payment handler error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Internal server error during payment verification.' }),
    };
  }
};
