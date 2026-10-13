import type { Handler } from '@netlify/functions';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { buildOrderCancellationEmail, type OrderEmailData, type OrderItemEmailData } from './_email-templates';
import { Resend } from 'resend';
import { getSecureCorsHeaders, handleCorsPreflight, getRequiredEnv } from './_security';

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
    console.error('[cancel-razorpay-order] Config error:', cfgErr.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@flintaindia.com';

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, accessToken, reason } = body as { orderId: string; accessToken: string; reason?: string };

    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId' }) };
    }

    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required to process refund.' }) };
    }

    // 1. Authenticate user session with Supabase Auth
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(accessToken);

    if (authErr || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized user session.' }) };
    }

    // 2. Fetch authoritative database order record with order_items
    const dbClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

    const { data: order, error: orderErr } = await dbClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order record not found.' }) };
    }

    // 3. Security & Validation Guards
    if (order.user_id && order.user_id !== user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized to cancel this order.' }) };
    }

    if (order.payment_method !== 'razorpay') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'This refund endpoint is only for Razorpay orders.' }) };
    }

    // Check if already refunded / cancelled
    if (order.payment_status === 'refunded' || order.refund_status === 'processed') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          alreadyRefunded: true,
          message: 'Order has already been refunded.',
          refundId: order.razorpay_refund_id,
        }),
      };
    }

    if (order.payment_status !== 'paid') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Cannot refund order with payment status "${order.payment_status}".` }),
      };
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Orders in "${order.status.toUpperCase()}" status cannot be cancelled.` }),
      };
    }

    if (!order.razorpay_payment_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing Razorpay payment ID on database order record.' }),
      };
    }

    // 4. Execute Razorpay Refund via Razorpay API (Server-side)
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Payment gateway credentials are not configured on the server.' }),
      };
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const refundAmountPaise = Math.round(Number(order.total_amount) * 100);

    let refund: Record<string, unknown>;
    try {
      refund = (await razorpay.payments.refund(order.razorpay_payment_id, {
        amount: refundAmountPaise,
        notes: {
          orderId: order.id,
          orderNumber: order.order_number,
          reason: reason || 'Customer cancellation',
        },
      })) as unknown as Record<string, unknown>;
    } catch (refundErr: any) {
      console.error('[cancel-razorpay-order] Razorpay refund API failed:', refundErr);
      const errMsg =
        refundErr?.description ||
        refundErr?.error?.description ||
        refundErr?.message ||
        'Razorpay refund API call failed.';
      // CRITICAL: Order MUST NOT be marked cancelled if refund fails!
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Refund failed: ${errMsg}. Order remains active.` }),
      };
    }

    const refundId = String(refund?.id || '');

    // 5. Finalize refund state & restock in PostgreSQL (Atomic RPC with JS fallback)
    const { error: rpcErr } = await dbClient.rpc('finalize_razorpay_refund', {
      p_order_id: order.id,
      p_razorpay_refund_id: refundId,
      p_reason: reason || 'Customer requested cancellation & refund',
    });

    if (rpcErr) {
      console.warn('[cancel-razorpay-order] RPC finalize_razorpay_refund failed, running JS fallback:', rpcErr.message);

      // JS Fallback: Direct table update
      await dbClient
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          razorpay_refund_id: refundId,
          refund_status: 'processed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (order.stock_deducted && !order.stock_restored) {
        for (const item of order.order_items || []) {
          if (item.variant_id && item.quantity > 0) {
            const { data: v } = await dbClient
              .from('product_variants')
              .select('stock')
              .eq('id', item.variant_id)
              .single();
            if (v) {
              await dbClient
                .from('product_variants')
                .update({ stock: (v.stock || 0) + item.quantity })
                .eq('id', item.variant_id);
            }
          }
        }
        await dbClient.from('orders').update({ stock_restored: true }).eq('id', order.id);
      }
    }

    // 6. Send Cancellation / Refund Confirmation Email
    if (RESEND_API_KEY) {
      try {
        const targetEmail = user.email || order.shipping_email;
        if (targetEmail) {
          const items: OrderItemEmailData[] = (order.order_items || []).map((item: Record<string, unknown>) => ({
            name: String(item.product_name_snapshot || 'FLINT Garment'),
            color: String(item.color_name_snapshot || 'Default'),
            size: String(item.size_snapshot || 'Standard'),
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unit_price) || 0,
            totalPrice: Number(item.total_price) || 0,
          }));

          const emailData: OrderEmailData = {
            orderNumber: String(order.order_number || ''),
            customerName: String(order.shipping_name || 'Valued Client'),
            customerEmail: targetEmail,
            items,
            subtotal: Number(order.subtotal) || 0,
            discountAmount: Number(order.discount_amount) || 0,
            shippingAmount: Number(order.shipping_amount) || 0,
            totalAmount: Number(order.total_amount) || 0,
            paymentMethod: 'razorpay',
            cancellationReason: reason || 'Customer requested cancellation & refund',
            refundAmount: Number(order.total_amount) || 0,
            refundStatus: 'processed',
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

          const { subject, html } = buildOrderCancellationEmail(emailData);
          const resend = new Resend(RESEND_API_KEY);

          let resendRes = await resend.emails.send({
            from: `FLINT A <${SENDER_EMAIL}>`,
            to: [targetEmail],
            subject,
            html,
          });

          if (resendRes.error) {
            resendRes = await resend.emails.send({
              from: 'FLINT A <onboarding@resend.dev>',
              to: [targetEmail],
              subject,
              html,
            });
          }

          if (!resendRes.error) {
            await dbClient.from('orders').update({ cancellation_email_sent: true }).eq('id', order.id);
          }
        }
      } catch (eErr) {
        console.warn('[cancel-razorpay-order] Email send warning:', eErr);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Order cancelled and full refund processed successfully.',
        refundId,
      }),
    };
  } catch (err: any) {
    console.error('[cancel-razorpay-order] Handler error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Server error processing refund.' }),
    };
  }
};
