import type { Handler } from '@netlify/functions';
import { trackShipmentByAWB } from './_shiprocket-client';
import { createClient } from '@supabase/supabase-js';
import { getSecureCorsHeaders, handleCorsPreflight, getRequiredEnv } from './_security';

export const handler: Handler = async (event) => {
  const preflight = handleCorsPreflight(event);
  if (preflight) return preflight;

  const headers = getSecureCorsHeaders(event);

  // ── Strict environment variable resolution (zero hardcoded fallbacks) ──
  let SUPABASE_URL: string;
  let SUPABASE_ANON_KEY: string;
  try {
    SUPABASE_URL = getRequiredEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
    SUPABASE_ANON_KEY = getRequiredEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
  } catch (cfgErr: any) {
    console.error('[track-shipment] Config error:', cfgErr.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  try {
    const awbParam = event.queryStringParameters?.awb;
    const orderIdParam = event.queryStringParameters?.orderId || event.queryStringParameters?.order_id;

    let awbCode = awbParam;

    // If orderId is provided without AWB, look up AWB in Supabase
    if (!awbCode && orderIdParam) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: order } = await supabase
        .from('orders')
        .select('awb_code, courier_name, tracking_url')
        .or(`id.eq.${orderIdParam},order_number.eq.${orderIdParam}`)
        .single();

      if (order?.awb_code) {
        awbCode = order.awb_code;
      }
    }

    if (!awbCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide an AWB code or orderId.' }),
      };
    }

    const trackingData = await trackShipmentByAWB(awbCode);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        awb: awbCode,
        data: trackingData,
      }),
    };
  } catch (err: any) {
    console.error('[track-shipment] Error:', err?.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err?.message || 'Failed to fetch tracking data.',
      }),
    };
  }
};
