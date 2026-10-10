/**
 * FLINT A — Branded Email HTML Templates
 *
 * These templates produce inline-styled, responsive HTML emails
 * that render consistently across Gmail, Outlook, Apple Mail, etc.
 * All order data is retrieved directly from database records.
 */

export interface OrderItemEmailData {
  name: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemEmailData[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  orderDate: string;
  cancellationReason?: string;
  cancellationDate?: string;
  refundAmount?: number;
  refundStatus?: string;
}

// ─── Shared Layout ────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FLINT A</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0A0A0A;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid rgba(10,10,10,0.08);">
          ${content}
        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:24px;">
          <tr>
            <td style="padding:0 24px;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#A39E93;text-transform:uppercase;">
                FLINT A INDIA &nbsp;·&nbsp; flintaindia.com
              </p>
              <p style="margin:8px 0 0;font-size:10px;color:#A39E93;">
                This is an automated email. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function brandHeader(): string {
  return `
    <tr>
      <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(10,10,10,0.06);">
        <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:#0A0A0A;">
          FLINT A
        </p>
      </td>
    </tr>`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Order Confirmation Email ─────────────────────────────────────
export function buildOrderConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(10,10,10,0.06);">
          <p style="margin:0;font-size:13px;font-weight:600;color:#0A0A0A;">${item.name}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#736E65;">${item.color} · ${item.size} · Qty: ${item.quantity}</p>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(10,10,10,0.06);text-align:right;vertical-align:top;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#0A0A0A;">${formatCurrency(item.totalPrice)}</p>
        </td>
      </tr>`
    )
    .join('');

  const content = `
    ${brandHeader()}
    
    <!-- Success Badge -->
    <tr>
      <td style="padding:32px 40px 16px;text-align:center;">
        <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:#ecfdf5;color:#059669;font-size:24px;text-align:center;">
          ✓
        </div>
        <h1 style="margin:16px 0 0;font-size:22px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#0A0A0A;">
          ORDER CONFIRMED
        </h1>
        <p style="margin:8px 0 0;font-size:12px;color:#736E65;">
          Thank you, ${data.customerName}. Your order has been placed successfully.
        </p>
      </td>
    </tr>

    <!-- Order Number & Date -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;border:1px solid rgba(10,10,10,0.06);">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">ORDER NUMBER</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;letter-spacing:1px;color:#0A0A0A;">${data.orderNumber}</p>
            </td>
            <td style="padding:16px 20px;text-align:right;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">DATE</p>
              <p style="margin:4px 0 0;font-size:13px;color:#0A0A0A;">${formatDate(data.orderDate)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:0 40px 24px;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">ORDERED ITEMS</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemsHtml}
        </table>
      </td>
    </tr>

    <!-- Pricing Summary -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:12px;color:#736E65;">Subtotal</td>
            <td style="padding:8px 0;font-size:12px;color:#0A0A0A;text-align:right;">${formatCurrency(data.subtotal)}</td>
          </tr>
          ${data.discountAmount > 0 ? `
          <tr>
            <td style="padding:8px 0;font-size:12px;color:#059669;">Coupon Discount</td>
            <td style="padding:8px 0;font-size:12px;color:#059669;text-align:right;">-${formatCurrency(data.discountAmount)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 0;font-size:12px;color:#736E65;">Shipping</td>
            <td style="padding:8px 0;font-size:12px;color:#0A0A0A;text-align:right;">${data.shippingAmount > 0 ? formatCurrency(data.shippingAmount) : 'FREE'}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#0A0A0A;border-top:1px solid rgba(10,10,10,0.1);">Total Amount</td>
            <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#0A0A0A;text-align:right;border-top:1px solid rgba(10,10,10,0.1);">${formatCurrency(data.totalAmount)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Payment & Shipping -->
    <tr>
      <td style="padding:0 40px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:16px 20px;background-color:#FAF9F6;border:1px solid rgba(10,10,10,0.06);vertical-align:top;width:50%;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">PAYMENT METHOD</p>
              <p style="margin:6px 0 0;font-size:12px;color:#0A0A0A;font-weight:600;">${data.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}</p>
            </td>
            <td style="width:12px;"></td>
            <td style="padding:16px 20px;background-color:#FAF9F6;border:1px solid rgba(10,10,10,0.06);vertical-align:top;width:50%;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">SHIPPING ADDRESS</p>
              <p style="margin:6px 0 0;font-size:12px;color:#0A0A0A;line-height:1.6;">
                <strong>${data.shippingAddress.name}</strong><br/>
                ${data.shippingAddress.line1}${data.shippingAddress.line2 ? ', ' + data.shippingAddress.line2 : ''}<br/>
                ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}<br/>
                Phone: ${data.shippingAddress.phone}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <a href="https://flintaindia.com/account/orders" style="display:inline-block;padding:14px 40px;background-color:#0A0A0A;color:#FAF9F6;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
          VIEW ORDER
        </a>
      </td>
    </tr>`;

  return {
    subject: `Order Confirmed — ${data.orderNumber} | FLINT A`,
    html: emailWrapper(content),
  };
}

// ─── Order Cancellation Email ─────────────────────────────────────
export function buildOrderCancellationEmail(data: OrderEmailData): { subject: string; html: string } {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(10,10,10,0.06);">
          <p style="margin:0;font-size:13px;font-weight:600;color:#0A0A0A;">${item.name}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#736E65;">${item.color} · ${item.size} · Qty: ${item.quantity}</p>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(10,10,10,0.06);text-align:right;vertical-align:top;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#0A0A0A;">${formatCurrency(item.totalPrice)}</p>
        </td>
      </tr>`
    )
    .join('');

  const content = `
    ${brandHeader()}

    <!-- Cancellation Badge -->
    <tr>
      <td style="padding:32px 40px 16px;text-align:center;">
        <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:#fef2f2;color:#dc2626;font-size:24px;text-align:center;">
          ✕
        </div>
        <h1 style="margin:16px 0 0;font-size:22px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#0A0A0A;">
          ORDER CANCELLED
        </h1>
        <p style="margin:8px 0 0;font-size:12px;color:#736E65;">
          Hello ${data.customerName}, your order ${data.orderNumber} has been cancelled.
        </p>
      </td>
    </tr>

    <!-- Order Summary Box -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;border:1px solid rgba(10,10,10,0.06);">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">ORDER NUMBER</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;letter-spacing:1px;color:#0A0A0A;">${data.orderNumber}</p>
            </td>
            <td style="padding:16px 20px;text-align:right;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">CANCELLED AMOUNT</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0A0A0A;">${formatCurrency(data.totalAmount)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${itemsHtml ? `
    <!-- Cancelled Items -->
    <tr>
      <td style="padding:0 40px 24px;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">CANCELLED ITEMS</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemsHtml}
        </table>
      </td>
    </tr>` : ''}

    ${data.cancellationReason ? `
    <!-- Reason -->
    <tr>
      <td style="padding:0 40px 24px;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;color:#736E65;text-transform:uppercase;">CANCELLATION REASON</p>
        <p style="margin:0;font-size:12px;color:#0A0A0A;line-height:1.6;background-color:#FAF9F6;padding:12px 16px;border:1px solid rgba(10,10,10,0.06);">${data.cancellationReason}</p>
      </td>
    </tr>` : ''}

    <!-- Refund Info -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid rgba(245,158,11,0.2);">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#92400e;text-transform:uppercase;font-weight:600;">REFUND INFORMATION</p>
              <p style="margin:6px 0 0;font-size:12px;color:#78350f;line-height:1.6;">
                ${
                  data.refundStatus === 'processed' || data.paymentStatus === 'paid' || (data.refundAmount && data.refundAmount > 0)
                    ? 'Your refund of ' + formatCurrency(data.refundAmount || data.totalAmount) + ' will be processed within 5–7 business days to your original payment method.'
                    : data.paymentMethod === 'cod'
                    ? 'This order was placed via Cash on Delivery (COD). No payment was collected, so no refund is required.'
                    : 'No payment was collected for this order. No refund is required.'
                }
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <a href="https://flintaindia.com/shop" style="display:inline-block;padding:14px 40px;background-color:#0A0A0A;color:#FAF9F6;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
          CONTINUE SHOPPING
        </a>
        <p style="margin:12px 0 0;font-size:11px;color:#736E65;">
          Have questions? Contact us at <a href="mailto:support@flintaindia.com" style="color:#0A0A0A;text-decoration:underline;">support@flintaindia.com</a>
        </p>
      </td>
    </tr>`;

  return {
    subject: `Order Cancelled — ${data.orderNumber} | FLINT A`,
    html: emailWrapper(content),
  };
}
