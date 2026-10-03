-- ============================================================================
-- SHIPROCKET COURIER & TRACKING INTEGRATION MIGRATION
-- ============================================================================
-- Adds courier, AWB tracking, and shipment fields to the orders table.
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/klzwqmphtyvwubfqhgbf/sql

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS awb_code TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipment_status TEXT;

-- Create index on awb_code for fast tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_awb_code ON public.orders(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON public.orders(shiprocket_order_id);
