import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildOrderCancellationEmail, type OrderEmailData, type OrderItemEmailData } from './_email-templates';
import { getSecureCorsHeaders, handleCorsPreflight, getRequiredEnv } from './_security';

/**
 * Netlify Function: send-cancellation-email
 *
 * Called after an order cancellation succeeds.
 * Accepts { orderId, accessToken, reason }.
 * Fetches authoritative order and order_items records directly from Supabase DB.
 * Generates and sends order cancellation email via Resend.
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
    console.error('[send-cancellation-email] Config error:', cfgErr.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@flintaindia.com';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, accessToken, reason } = body as { orderId: string; accessToken: string; reason?: string };

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId' }) };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing access token' }) };
    }

    // 1. Authenticate user with Supabase Auth
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user || !user.email) {
      console.error('Auth verification failed:', authErr);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized user token' }) };
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

    // If an online order was never paid, no cancellation or refund email should be sent
    if (order.payment_method === 'razorpay' && order.payment_status !== 'paid') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Unpaid order cancelled; no email needed.' }),
      };
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
      customerEmail: user.email,
      items,
      subtotal: Number(order.subtotal) || 0,
      discountAmount: Number(order.discount_amount) || 0,
      shippingAmount: Number(order.shipping_amount) || 0,
      totalAmount: Number(order.total_amount) || 0,
      paymentMethod: String(order.payment_method || 'cod'),
      paymentStatus: String(order.payment_status || 'pending'),
      refundStatus: String(order.refund_status || ''),
      refundAmount: Number(order.refund_amount || 0),
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
      cancellationReason: reason || 'Customer requested cancellation',
      cancellationDate: String(order.updated_at || new Date().toISOString()),
    };

    // 4. Build HTML email and send via Resend
    const { subject, html } = buildOrderCancellationEmail(orderEmailData);

    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `FLINT A <${SENDER_EMAIL}>`,
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error('Resend send error:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send email via Resend' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, emailId: data?.id }),
    };
  } catch (err) {
    console.error('send-cancellation-email error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
