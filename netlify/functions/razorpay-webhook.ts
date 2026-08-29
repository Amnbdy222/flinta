import type { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '../../src/services/emailService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured in environment variables.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook secret not configured.' }) };
  }

  const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'];
  if (!signature) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing x-razorpay-signature header.' }) };
  }

  try {
    const rawBody = event.body || '';

    // 1. Verify Razorpay Webhook Signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Invalid Razorpay Webhook Signature:', { expectedSignature, signature });
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid webhook signature.' }) };
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    console.log(`Received verified Razorpay webhook event: ${eventType}`);

    // Process payment.captured or order.paid events
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const rzpPaymentId = paymentEntity?.id;
      const rzpOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const flintOrderId = paymentEntity?.notes?.flint_order_id;

      if (!rzpOrderId && !flintOrderId) {
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'No matching order identifiers in webhook payload.' }) };
      }

      const dbClient = SUPABASE_SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Look up order in database
      let query = dbClient.from('orders').select('*');
      if (flintOrderId) {
        query = query.eq('id', flintOrderId);
      } else if (rzpOrderId) {
        query = query.eq('razorpay_order_id', rzpOrderId);
      }

      const { data: order, error: fetchErr } = await query.maybeSingle();

      if (fetchErr || !order) {
        console.warn('Webhook could not locate order in database:', { flintOrderId, rzpOrderId, fetchErr });
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Order not found in database.' }) };
      }

      // IDEMPOTENCY CHECK: If already paid, return 200 OK without duplicate updates/emails
      if (order.payment_status === 'paid' && order.status === 'processing') {
        console.log(`Order ${order.id} is already marked as paid. Webhook idempotent exit.`);
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Order already processed.' }) };
      }

      // Idempotently update order status to paid
      await dbClient
        .from('orders')
        .update({
          payment_method: 'razorpay',
          payment_status: 'paid',
          status: 'processing',
          razorpay_order_id: rzpOrderId || order.razorpay_order_id,
          razorpay_payment_id: rzpPaymentId || order.razorpay_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Trigger order confirmation email
      try {
        await sendOrderConfirmationEmail(order.id);
      } catch (e) {
        console.warn('Webhook email trigger warning:', e);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', event: eventType }) };
  } catch (err: any) {
    console.error('Razorpay Webhook Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || 'Webhook processing failed.' }) };
  }
};
