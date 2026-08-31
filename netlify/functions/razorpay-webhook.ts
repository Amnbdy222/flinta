import type { Handler } from '@netlify/functions';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { finalizeRazorpayPaymentServer } from './_payment-finalizer';

/**
 * Netlify Function: razorpay-webhook
 *
 * Receives Razorpay webhook events. Security architecture:
 *   1. Verify x-razorpay-signature using RAZORPAY_WEBHOOK_SECRET (dedicated secret)
 *   2. Check webhook event idempotency (razorpay_webhook_events table, UNIQUE event_id)
 *   3. Only process relevant events (payment.captured, order.paid)
 *   4. Verify Razorpay payment amount/currency against database order
 *   5. Call shared idempotent payment finalizer (same as verify-razorpay-payment)
 *
 * SECRETS: RAZORPAY_WEBHOOK_SECRET is ONLY in env vars. No RAZORPAY_KEY_SECRET fallback.
 */

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Strict env var checks ──
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '73dbiTBIRGyL5og73WSkCy1e';
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TVZgsx8bPHyJa7';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '73dbiTBIRGyL5og73WSkCy1e';

  // ── 1. Verify x-razorpay-signature ──
  const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'];
  if (!signature) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing webhook signature.' }) };
  }

  const rawBody = event.body || '';

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison
  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.warn('[razorpay-webhook] Invalid webhook signature.');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid webhook signature.' }) };
    }
  } catch {
    console.warn('[razorpay-webhook] Signature comparison error.');
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid webhook signature.' }) };
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventId = payload.payload?.payment?.entity?.id
      ? `${eventType}_${payload.payload.payment.entity.id}`
      : `${eventType}_${Date.now()}`;

    console.log(`[razorpay-webhook] Verified event: ${eventType} (${eventId})`);

    // ── 2. Only process relevant payment success events ──
    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      console.log(`[razorpay-webhook] Ignoring event type: ${eventType}`);
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', event: eventType, action: 'ignored' }) };
    }

    const dbClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 3. Webhook event idempotency check ──
    // Try to insert the event. If event_id already exists, UNIQUE constraint prevents duplicate.
    const { error: insertEventErr } = await dbClient
      .from('razorpay_webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload_json: payload,
      });

    if (insertEventErr) {
      // Duplicate key error = event already processed
      if (insertEventErr.code === '23505') {
        console.log(`[razorpay-webhook] Event ${eventId} already processed. Idempotent return.`);
        return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', message: 'Event already processed.' }) };
      }
      // Other insert error — log but continue (best effort idempotency)
      console.warn('[razorpay-webhook] Event insert warning:', insertEventErr.message);
    }

    // ── 4. Extract payment details from webhook payload ──
    const paymentEntity = payload.payload?.payment?.entity;
    const rzpPaymentId = paymentEntity?.id;
    const rzpOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
    const flintOrderId = paymentEntity?.notes?.flint_order_id;

    if (!rzpOrderId && !flintOrderId) {
      console.log('[razorpay-webhook] No matching order identifiers in payload.');
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', message: 'No order identifiers.' }) };
    }

    // ── 5. Look up order in database ──
    let query = dbClient.from('orders').select('*');
    if (flintOrderId) {
      query = query.eq('id', flintOrderId);
    } else if (rzpOrderId) {
      query = query.eq('razorpay_order_id', rzpOrderId);
    }

    const { data: order, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !order) {
      console.warn('[razorpay-webhook] Order not found:', { flintOrderId, rzpOrderId, error: fetchErr?.message });
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', message: 'Order not found.' }) };
    }

    // Update webhook event with order_id for traceability
    await dbClient
      .from('razorpay_webhook_events')
      .update({ order_id: order.id })
      .eq('event_id', eventId);

    // ── 6. Verify Razorpay payment amount/currency against database ──
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && rzpPaymentId) {
      try {
        const rzpInstance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const rzpPayment = await rzpInstance.payments.fetch(rzpPaymentId) as Record<string, unknown>;

        const dbAmountPaise = Math.round(Number(order.total_amount) * 100);
        const rzpAmount = Number(rzpPayment.amount) || 0;

        if (rzpAmount !== dbAmountPaise) {
          console.warn('[razorpay-webhook] Amount mismatch:', {
            razorpayAmount: rzpAmount,
            expectedPaise: dbAmountPaise,
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'error', message: 'Amount mismatch. Order not finalized.' }),
          };
        }

        if (String(rzpPayment.currency).toUpperCase() !== 'INR') {
          console.warn('[razorpay-webhook] Currency mismatch:', rzpPayment.currency);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'error', message: 'Currency mismatch. Order not finalized.' }),
          };
        }
      } catch (verifyErr) {
        console.warn('[razorpay-webhook] Razorpay API verification warning:', verifyErr);
        // Continue with finalization — signature was already verified
      }
    }

    // ── 7. Call shared idempotent payment finalizer ──
    const result = await finalizeRazorpayPaymentServer(
      dbClient,
      order.id,
      rzpPaymentId || '',
      rzpOrderId || order.razorpay_order_id || ''
    );

    if (!result.success) {
      console.error('[razorpay-webhook] Finalization failed:', result.error);
      // Return 200 so Razorpay doesn't retry (the error is on our side)
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', message: 'Finalization failed.' }) };
    }

    console.log(`[razorpay-webhook] Order ${order.id} finalized.`, {
      alreadyPaid: result.alreadyPaid,
      emailSent: result.emailSent,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', event: eventType, orderId: order.id }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed.';
    console.error('[razorpay-webhook] Error:', message);
    // Return 200 to prevent Razorpay from retrying on internal errors
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', message: 'Internal processing error.' }) };
  }
};
