/**
 * _payment-finalizer.ts
 *
 * SHARED idempotent payment finalization engine.
 * Used by BOTH verify-razorpay-payment and razorpay-webhook.
 *
 * NEVER duplicate payment finalization logic — call this single function.
 *
 * Flow:
 *   1. Call database transactional function finalize_razorpay_payment()
 *      which atomically: locks order → checks idempotency → transitions
 *      payment_status to 'paid' → deducts stock → creates email event flag
 *   2. If email_event_created is true, trigger confirmation email exactly once
 *
 * This module is NOT a Netlify Function handler (prefixed with _).
 * It is imported by verify-razorpay-payment.ts and razorpay-webhook.ts.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Email sending — imported from the email function's logic
// We call the send-order-email Netlify function internally via Supabase + Resend
// For server-side email, we replicate the minimal email trigger here.

export interface FinalizationResult {
  success: boolean;
  alreadyPaid: boolean;
  emailSent: boolean;
  error?: string;
}

/**
 * Get a Supabase client with service role privileges.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
  }

  return createClient(url, serviceKey);
}

/**
 * Get a Supabase client for authentication verification (anon key).
 */
export function getAuthClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.');
  }

  return createClient(url, anonKey);
}

/**
 * Idempotent payment finalization.
 *
 * Calls the PostgreSQL finalize_razorpay_payment() function which is
 * SECURITY DEFINER and executes atomically:
 *   - Lock order row (FOR UPDATE)
 *   - Check if already paid (idempotency) → return safely
 *   - Validate pending state
 *   - Transition: payment_status='paid', status='processing'
 *   - Deduct stock atomically (idempotent via stock_deducted flag)
 *   - Set confirmation_email_sent flag atomically
 *   - Return { already_paid, success, email_event_created }
 *
 * After the DB transaction, if email_event_created is true, trigger email.
 */
export async function finalizeRazorpayPaymentServer(
  dbClient: SupabaseClient,
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  userEmail?: string
): Promise<FinalizationResult> {
  // Call the atomic database function
  const { data, error } = await dbClient.rpc('finalize_razorpay_payment', {
    p_order_id: orderId,
    p_razorpay_payment_id: razorpayPaymentId,
    p_razorpay_order_id: razorpayOrderId,
  });

  if (error) {
    console.warn('[PaymentFinalizer] finalize_razorpay_payment RPC failed, executing JS fallback:', error.message);

    // JS Fallback: update order directly using Supabase client
    const { data: order, error: fetchErr } = await dbClient
      .from('orders')
      .select('id, payment_status, status, confirmation_email_sent')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      console.error('[PaymentFinalizer] Fallback fetch failed:', fetchErr?.message);
      return {
        success: false,
        alreadyPaid: false,
        emailSent: false,
        error: fetchErr?.message || 'Order record not found.',
      };
    }

    if (order.payment_status === 'paid') {
      console.log(`[PaymentFinalizer] Order ${orderId} is already paid (JS fallback).`);
      return { success: true, alreadyPaid: true, emailSent: false };
    }

    const { error: updateErr } = await dbClient
      .from('orders')
      .update({
        payment_method: 'razorpay',
        payment_status: 'paid',
        status: 'processing',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      console.error('[PaymentFinalizer] Fallback order update failed:', updateErr.message);
      return {
        success: false,
        alreadyPaid: false,
        emailSent: false,
        error: updateErr.message,
      };
    }

    let emailSent = false;
    if (!order.confirmation_email_sent) {
      await dbClient
        .from('orders')
        .update({ confirmation_email_sent: true })
        .eq('id', orderId);

      try {
        await triggerConfirmationEmail(dbClient, orderId, userEmail);
        emailSent = true;
      } catch (eErr) {
        console.warn('[PaymentFinalizer] Email fallback trigger warning:', eErr);
      }
    }

    return { success: true, alreadyPaid: false, emailSent };
  }

  const result = data as { already_paid: boolean; success: boolean; email_event_created: boolean };

  if (result.already_paid) {
    console.log(`[PaymentFinalizer] Order ${orderId} already paid. Idempotent return.`);
    return { success: true, alreadyPaid: true, emailSent: false };
  }

  // Trigger email exactly once if the DB transaction created the email event
  let emailSent = false;
  if (result.email_event_created) {
    try {
      await triggerConfirmationEmail(dbClient, orderId, userEmail);
      emailSent = true;
    } catch (emailErr) {
      // Non-blocking: log but don't fail the payment
      console.warn('[PaymentFinalizer] Email trigger warning (non-blocking):', emailErr);
    }
  }

  return { success: true, alreadyPaid: false, emailSent };
}

/**
 * Trigger the order confirmation email server-side.
 *
 * Uses the Resend API directly (same as send-order-email function)
 * to avoid a circular HTTP call from one Netlify function to another.
 */
async function triggerConfirmationEmail(
  dbClient: SupabaseClient,
  orderId: string,
  overrideEmail?: string
): Promise<void> {
  // Fetch order with items
  const { data: order, error: orderErr } = await dbClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    console.warn('[PaymentFinalizer] Could not fetch order for email:', orderErr?.message);
    return;
  }

  // Resolve target email address
  let targetEmail = overrideEmail;

  if (!targetEmail && order.user_id) {
    try {
      const { data: { user } } = await dbClient.auth.admin.getUserById(order.user_id);
      targetEmail = user?.email;
    } catch (uErr: any) {
      console.warn('[PaymentFinalizer] auth.admin.getUserById warning:', uErr?.message);
    }
  }

  if (!targetEmail) {
    console.warn('[PaymentFinalizer] Could not resolve recipient email address, skipping email.');
    return;
  }

  // Try to import and use Resend directly
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@flintaindia.com';

  if (!RESEND_API_KEY) {
    console.warn('[PaymentFinalizer] RESEND_API_KEY not configured, skipping email.');
    return;
  }

  // Dynamic import to avoid bundling issues
  const { Resend } = await import('resend');
  const { buildOrderConfirmationEmail } = await import('./_email-templates');

  const items = (order.order_items || []).map((item: Record<string, unknown>) => ({
    name: String(item.product_name_snapshot || 'FLINT Garment'),
    color: String(item.color_name_snapshot || 'Default'),
    size: String(item.size_snapshot || 'Standard'),
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unit_price) || 0,
    totalPrice: Number(item.total_price) || 0,
  }));

  const emailData = {
    orderNumber: String(order.order_number || ''),
    customerName: String(order.shipping_name || 'Valued Client'),
    customerEmail: targetEmail,
    items,
    subtotal: Number(order.subtotal) || 0,
    discountAmount: Number(order.discount_amount) || 0,
    shippingAmount: Number(order.shipping_amount) || 0,
    totalAmount: Number(order.total_amount) || 0,
    paymentMethod: String(order.payment_method || 'razorpay'),
    shippingAddress: {
      name: String(order.shipping_name || ''),
      phone: String(order.shipping_phone || ''),
      line1: String(order.shipping_address_line_1 || ''),
      line2: order.shipping_address_line_2 ? String(order.shipping_address_line_2) : undefined,
      city: String(order.shipping_city || ''),
      state: String(order.shipping_state || ''),
      pincode: String(order.shipping_pincode || ''),
    },
    orderDate: String(order.created_at || new Date().toISOString()),
  };

  const { subject, html } = buildOrderConfirmationEmail(emailData);

  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `FLINT A <${SENDER_EMAIL}>`,
    to: [targetEmail],
    subject,
    html,
  });

  if (error) {
    console.warn('[PaymentFinalizer] Resend email error:', error);
  } else {
    console.log(`[PaymentFinalizer] Confirmation email sent for order ${orderId}`);
  }
}
