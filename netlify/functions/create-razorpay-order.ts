import type { Handler } from '@netlify/functions';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

/**
 * Netlify Function: create-razorpay-order
 *
 * ZERO-TRUST order creation:
 *   1. Authenticate user JWT
 *   2. Verify order ownership
 *   3. Validate order is in pending_payment/pending state
 *   4. Guard against duplicate Razorpay order creation
 *   5. Read server-authoritative total from database (NEVER from frontend)
 *   6. Create Razorpay order server-side
 *   7. Save razorpay_order_id in database
 *
 * SECRETS: RAZORPAY_KEY_SECRET is ONLY in env vars. Never hardcoded. Never returned.
 */

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Strict env var checks ──
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[create-razorpay-order] Missing Supabase configuration.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error('[create-razorpay-order] Razorpay credentials not configured in environment variables.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment service not configured.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, accessToken } = body as { orderId: string; accessToken: string };

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId.' }) };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authentication token.' }) };
    }

    // ── 1. Authenticate user JWT ──
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      console.error('[create-razorpay-order] Auth failed:', authErr?.message);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized.' }) };
    }

    // ── 2. Fetch order from database (service role for reliable access) ──
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
      console.error('[create-razorpay-order] Order not found:', orderErr?.message);
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found.' }) };
    }

    // ── 3. Verify ownership ──
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized access to this order.' }) };
    }

    // ── 4. Validate order state ──
    // Only allow creating Razorpay orders for pending orders
    if (order.payment_status !== 'pending') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Order payment status is "${order.payment_status}". Expected "pending".` }),
      };
    }

    if (order.status === 'cancelled') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cannot create payment for a cancelled order.' }) };
    }

    // ── 5. Calculate server-authoritative amount ──
    const totalAmount = Number(order.total_amount) || 0;
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise < 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Order total must be at least ₹1.00 (100 paise).' }),
      };
    }

    // ── 6. Duplicate Razorpay order guard ──
    // If order already has a valid razorpay_order_id with matching amount, return it
    if (order.razorpay_order_id) {
      console.log(`[create-razorpay-order] Order ${orderId} has razorpay_order_id: ${order.razorpay_order_id}. Checking compatibility.`);

      try {
        const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const existingRzpOrder = await instance.orders.fetch(order.razorpay_order_id);

        // Only reuse if the Razorpay order is in a payable state AND the amount matches 100%
        if (
          (existingRzpOrder.status === 'created' || existingRzpOrder.status === 'attempted') &&
          Number(existingRzpOrder.amount) === amountInPaise
        ) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              order_id: existingRzpOrder.id,
              razorpay_order_id: existingRzpOrder.id,
              amount: existingRzpOrder.amount,
              currency: existingRzpOrder.currency,
              receipt: existingRzpOrder.receipt,
            }),
          };
        }

        // If the existing Razorpay order is paid/closed, don't create another
        if (existingRzpOrder.status === 'paid') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'This order has already been paid.' }) };
        }

        console.log(`[create-razorpay-order] Existing Razorpay order amount (${existingRzpOrder.amount}) != DB amount (${amountInPaise}) or status (${existingRzpOrder.status}). Creating new.`);
      } catch (fetchErr) {
        console.warn('[create-razorpay-order] Could not fetch existing Razorpay order, creating new:', fetchErr);
      }
    }

    // ── 7. Create Razorpay order via SDK ──
    const instance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await instance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: String(order.order_number || `FL-${Date.now()}`),
      notes: {
        flint_order_id: order.id,
        flint_order_number: order.order_number || '',
        user_id: user.id,
      },
    });

    // ── 8. Save razorpay_order_id in database ──
    const { error: updateErr } = await dbClient
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateErr) {
      console.error('[create-razorpay-order] Failed to save razorpay_order_id:', updateErr.message);
      // Non-fatal: the Razorpay order exists, verification will still work via notes
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    console.error('[create-razorpay-order] Handler error:', message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unable to create payment order. Please try again.' }),
    };
  }
};
