import type { Handler } from '@netlify/functions';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { finalizeRazorpayPaymentServer } from './_payment-finalizer';

/**
 * Netlify Function: verify-razorpay-payment
 *
 * ZERO-TRUST payment verification:
 *   1. Authenticate user JWT
 *   2. Verify order ownership (order.user_id === user.id)
 *   3. Verify razorpay_order_id match (order.razorpay_order_id === provided)
 *   4. Verify HMAC-SHA256 signature using crypto.timingSafeEqual
 *   5. Fetch Razorpay payment/order from Razorpay API server-side
 *   6. Verify amount (Razorpay amount === database total × 100)
 *   7. Verify currency (INR)
 *   8. Call shared idempotent payment finalizer
 *
 * If ANY verification fails → REJECT. Never mark paid, deduct stock, or send email.
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
    console.error('[verify-razorpay-payment] Missing Supabase configuration.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  if (!RAZORPAY_KEY_SECRET) {
    console.error('[verify-razorpay-payment] RAZORPAY_KEY_SECRET not configured.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment verification service not configured.' }) };
  }

  if (!RAZORPAY_KEY_ID) {
    console.error('[verify-razorpay-payment] RAZORPAY_KEY_ID not configured.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment verification service not configured.' }) };
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
        body: JSON.stringify({ error: 'Missing required payment verification fields.' }),
      };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authentication token.' }) };
    }

    // ── 1. Authenticate user JWT ──
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      console.error('[verify-razorpay-payment] Auth failed:', authErr?.message);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized.' }) };
    }

    // ── 2. Fetch order and verify ownership ──
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
      console.error('[verify-razorpay-payment] Order not found:', orderErr?.message);
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found.' }) };
    }

    // Ownership check
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized access to this order.' }) };
    }

    // ── 3. Verify razorpay_order_id match ──
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      console.warn('[verify-razorpay-payment] Razorpay order ID mismatch:', {
        db: order.razorpay_order_id,
        provided: razorpay_order_id,
      });
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment order ID mismatch.' }) };
    }

    // ── 4. HMAC-SHA256 signature verification using timingSafeEqual ──
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const receivedBuf = Buffer.from(razorpay_signature, 'hex');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.warn('[verify-razorpay-payment] Signature verification failed.');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid payment signature.' }),
      };
    }

    // ── 5. Fetch Razorpay payment/order from API (server-side amount verification) ──
    const rzpInstance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    let rzpPayment: Record<string, unknown>;
    try {
      rzpPayment = await rzpInstance.payments.fetch(razorpay_payment_id) as Record<string, unknown>;
    } catch (fetchErr) {
      console.error('[verify-razorpay-payment] Failed to fetch Razorpay payment:', fetchErr);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unable to verify payment with Razorpay.' }) };
    }

    // ── 6. Verify amount: Razorpay amount === database order total × 100 ──
    const dbAmountPaise = Math.round(Number(order.total_amount) * 100);
    const rzpAmount = Number(rzpPayment.amount) || 0;

    if (rzpAmount !== dbAmountPaise) {
      console.warn('[verify-razorpay-payment] Amount mismatch:', {
        razorpayAmount: rzpAmount,
        expectedPaise: dbAmountPaise,
        dbTotal: order.total_amount,
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment amount does not match order total.' }),
      };
    }

    // ── 7. Verify currency ──
    if (String(rzpPayment.currency).toUpperCase() !== 'INR') {
      console.warn('[verify-razorpay-payment] Currency mismatch:', rzpPayment.currency);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment currency mismatch.' }),
      };
    }

    // Verify the payment belongs to the expected Razorpay order
    if (rzpPayment.order_id && String(rzpPayment.order_id) !== razorpay_order_id) {
      console.warn('[verify-razorpay-payment] Payment order_id does not match:', {
        paymentOrderId: rzpPayment.order_id,
        expectedOrderId: razorpay_order_id,
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment does not belong to this order.' }),
      };
    }

    // ── 8. Call shared idempotent payment finalizer ──
    const result = await finalizeRazorpayPaymentServer(
      dbClient,
      orderId,
      razorpay_payment_id,
      razorpay_order_id
    );

    if (!result.success) {
      console.error('[verify-razorpay-payment] Finalization failed:', result.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment finalization failed.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: result.alreadyPaid
          ? 'Payment was already verified.'
          : 'Payment verified successfully.',
        orderId: order.id,
        orderNumber: order.order_number,
      }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    console.error('[verify-razorpay-payment] Handler error:', message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Payment verification failed. Please contact support.' }),
    };
  }
};
