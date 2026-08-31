import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildOrderConfirmationEmail, type OrderEmailData, type OrderItemEmailData } from './_email-templates';

/**
 * Netlify Function: send-order-email
 *
 * Called after successful order creation.
 * Accepts { orderId, accessToken }.
 * Fetches authorative order and order_items records directly from Supabase DB.
 * Generates and sends order confirmation email via Resend.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@flintaindia.com';

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

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, accessToken, recipientEmail } = body as { orderId: string; accessToken: string; recipientEmail?: string };

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId' }) };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing access token' }) };
    }

    // 1. Authenticate user with Supabase Auth
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      console.error('Auth verification failed:', authErr);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized user token' }) };
    }

    const targetEmail = recipientEmail || user.email;
    if (!targetEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Recipient email address missing' }) };
    }

    // 2. Fetch authoritative order data from Supabase DB using orderId
    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

    const { data: order, error: orderErr } = await dbClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.error('Failed to fetch order from DB:', orderErr);
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found in database' }) };
    }

    // Verify order ownership
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized to access this order' }) };
    }

    // 3. Map Database Record to OrderEmailData (100% database authoritative)
    const items: OrderItemEmailData[] = (order.order_items || []).map((item: Record<string, unknown>) => ({
      name: String(item.product_name_snapshot || 'FLINT Garment'),
      color: String(item.color_name_snapshot || 'Default'),
      size: String(item.size_snapshot || 'Standard'),
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
      totalPrice: Number(item.total_price) || 0,
    }));

    const orderEmailData: OrderEmailData = {
      orderNumber: String(order.order_number || ''),
      customerName: String(order.shipping_name || user.user_metadata?.full_name || 'Valued Client'),
      customerEmail: targetEmail,
      items,
      subtotal: Number(order.subtotal) || 0,
      discountAmount: Number(order.discount_amount) || 0,
      shippingAmount: Number(order.shipping_amount) || 0,
      totalAmount: Number(order.total_amount) || 0,
      paymentMethod: String(order.payment_method || 'cod'),
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

    // 4. Build HTML email and send via Resend
    const { subject, html } = buildOrderConfirmationEmail(orderEmailData);

    const resend = new Resend(RESEND_API_KEY);
    let resendResult = await resend.emails.send({
      from: `FLINT A <${SENDER_EMAIL}>`,
      to: [targetEmail],
      subject,
      html,
    });

    if (resendResult.error) {
      console.warn('Primary sender email error, trying fallback onboarding@resend.dev:', resendResult.error);
      resendResult = await resend.emails.send({
        from: 'FLINT A <onboarding@resend.dev>',
        to: [targetEmail],
        subject,
        html,
      });
    }

    if (resendResult.error) {
      console.error('Resend send error:', resendResult.error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: resendResult.error.message || 'Failed to send email via Resend' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, emailId: data?.id }),
    };
  } catch (err) {
    console.error('send-order-email error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
