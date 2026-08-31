import { supabase } from '../lib/supabase';

/**
 * Email Service — Fire-and-forget calls to Netlify Functions
 *
 * Frontend passes ONLY the database `orderId` and user's session `accessToken`.
 * The Netlify Function fetches database-authoritative order, items, and pricing
 * directly from Supabase, ensuring coupon discounts and totals match 100%.
 */

function getFunctionEndpoint(functionName: string): string {
  if (import.meta.env.VITE_FUNCTIONS_URL) {
    return `${import.meta.env.VITE_FUNCTIONS_URL}/${functionName}`;
  }
  // When testing on local Vite dev server (localhost:3000), fallback to production Netlify endpoint
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return `https://flintaindia.com/.netlify/functions/${functionName}`;
  }
  return `/.netlify/functions/${functionName}`;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Trigger order confirmation email after successful order placement in DB.
 * Fire-and-forget — does not throw on failure.
 */
export async function sendOrderConfirmationEmail(orderId: string, recipientEmail?: string): Promise<void> {
  try {
    if (!orderId) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const endpoint = getFunctionEndpoint('send-order-email');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, accessToken, recipientEmail }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[sendOrderConfirmationEmail] Endpoint ${endpoint} returned ${res.status}:`, errText);
    }
  } catch (err) {
    // Fire-and-forget: log warning, never block user checkout flow
    console.warn('Order confirmation email trigger warning (non-blocking):', err);
  }
}

/**
 * Trigger order cancellation email after customer cancels an order in DB.
 * Fire-and-forget — does not throw on failure.
 */
export async function sendOrderCancellationEmail(
  orderId: string,
  reason?: string
): Promise<void> {
  try {
    if (!orderId) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const endpoint = getFunctionEndpoint('send-cancellation-email');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, accessToken, reason }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[sendOrderCancellationEmail] Endpoint ${endpoint} returned ${res.status}:`, errText);
    }
  } catch (err) {
    // Fire-and-forget: log warning, never block user cancellation flow
    console.warn('Cancellation email trigger warning (non-blocking):', err);
  }
}
