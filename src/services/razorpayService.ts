import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayPaymentOptions {
  key: string;
  order_id: string; // Official Razorpay Order ID created by server
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export interface RazorpayVerificationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getFunctionEndpoint(functionName: string): string {
  if (import.meta.env.VITE_FUNCTIONS_URL) {
    return `${import.meta.env.VITE_FUNCTIONS_URL}/${functionName}`;
  }
  // When testing on local Vite dev server (localhost:5173 / localhost:3000), fallback to production Netlify endpoint
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return `https://flintaindia.com/.netlify/functions/${functionName}`;
  }
  return `/.netlify/functions/${functionName}`;
}

/**
 * Step 1: Create Razorpay Order via Netlify Backend Function
 */
export async function createRazorpayOrderBackend(
  orderId: string,
  accessToken: string
): Promise<{ order_id: string; razorpay_order_id: string; amount: number; currency: string }> {
  const endpoint = getFunctionEndpoint('create-razorpay-order');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, accessToken }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to create Razorpay backend order (Status ${res.status}).`);
  }

  return await res.json();
}

/**
 * Step 3: Verify Razorpay Payment Signature via Netlify Backend Function
 */
export async function verifyRazorpayPaymentBackend(
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  accessToken: string
): Promise<RazorpayVerificationResult> {
  const endpoint = getFunctionEndpoint('verify-razorpay-payment');
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        accessToken,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Razorpay payment signature verification failed (Status ${res.status}).`,
      };
    }

    return { success: true, message: data.message };
  } catch (err: any) {
    console.warn('[verifyRazorpayPaymentBackend] Fetch error:', err?.message);
    return {
      success: false,
      error: `Failed to fetch verification endpoint: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Full Razorpay Standard Checkout Flow:
 * 1. Authenticate user JWT token
 * 2. Create server-authoritative Razorpay Order
 * 3. Open Razorpay Checkout Modal
 * 4. Verify HMAC-SHA256 Payment Signature on Backend Server
 */
export async function openRazorpayCheckoutFlow(
  orderId: string,
  storeName: string,
  orderNumber: string,
  customerDetails: { name: string; email: string; contact: string },
  onSuccess: (paymentId: string) => void,
  onCancel?: () => void,
  onError?: (errorMsg: string) => void
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    const err = 'Razorpay Checkout SDK failed to load. Please check your internet connection.';
    if (onError) onError(err);
    throw new Error(err);
  }

  // 1. Get user session access token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    const err = 'You must be signed in to complete Razorpay payment.';
    if (onError) onError(err);
    throw new Error(err);
  }

  // 2. Call Netlify Function to create server-authoritative Razorpay Order
  let rzpOrder;
  try {
    rzpOrder = await createRazorpayOrderBackend(orderId, accessToken);
  } catch (err: any) {
    const errorMsg = err?.message || 'Unable to initialize Razorpay payment on server.';
    if (onError) onError(errorMsg);
    throw new Error(errorMsg);
  }

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    const errorMsg = 'VITE_RAZORPAY_KEY_ID is missing in frontend environment variables.';
    if (onError) onError(errorMsg);
    throw new Error(errorMsg);
  }

  let isPaymentSuccessful = false;

  // 3. Open Razorpay Standard Checkout Modal
  const rzpOptions = {
    key: razorpayKey,
    order_id: rzpOrder.order_id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency || 'INR',
    name: storeName || 'FLINT Apparel Co.',
    description: `Order #${orderNumber}`,
    prefill: {
      name: customerDetails.name,
      email: customerDetails.email,
      contact: customerDetails.contact,
    },
    theme: {
      color: '#0A0A0A',
    },
    handler: async function (response: any) {
      const paymentId = response?.razorpay_payment_id;
      const orderIdRzp = response?.razorpay_order_id || rzpOrder.order_id;
      const signature = response?.razorpay_signature;

      if (!paymentId || !signature) {
        if (onError) onError('Missing Razorpay payment signature from gateway modal.');
        return;
      }

      // 4. Server-Side HMAC-SHA256 Signature Verification via Netlify Function
      try {
        const verifyRes = await verifyRazorpayPaymentBackend(
          orderId,
          paymentId,
          orderIdRzp,
          signature,
          accessToken
        );

        if (!verifyRes.success) {
          if (onError) onError(verifyRes.error || 'Razorpay payment signature verification failed.');
          return;
        }

        isPaymentSuccessful = true;
        onSuccess(paymentId);
      } catch (vErr: any) {
        if (onError) onError(vErr?.message || 'Payment verification server error.');
      }
    },
    modal: {
      ondismiss: function () {
        if (isPaymentSuccessful) return;
        if (onCancel) onCancel();
      },
      onfailed: function (errorResponse: any) {
        if (isPaymentSuccessful) return;
        console.error('Razorpay payment failed:', errorResponse);
        if (onError) onError(errorResponse?.error?.description || 'Razorpay payment failed.');
      },
    },
  };

  const razorpayInstance = new window.Razorpay(rzpOptions);
  razorpayInstance.open();
}
