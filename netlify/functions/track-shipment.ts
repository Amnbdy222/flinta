import type { Handler } from '@netlify/functions';
import { trackShipmentByAWB } from './_shiprocket-client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klzwqmphtyvwubfqhgbf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
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
