-- ============================================================
-- FLINT STOREFRONT: RAZORPAY PRODUCTION-GRADE DATABASE MIGRATION
-- ============================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. ADD RAZORPAY IDENTIFIER COLUMNS TO ORDERS TABLE
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT NULL,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT NULL;

-- 2. CREATE INDEX FOR FAST WEBHOOK & SIGNATURE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);

-- 3. PERMANENTLY REMOVE INSECURE RPC FUNCTION (DO NOT GRANT PAYMENT STATUS MODIFICATION TO CLIENT/ANON)
DROP FUNCTION IF EXISTS public.confirm_razorpay_payment(UUID, TEXT);
DROP FUNCTION IF EXISTS public.confirm_razorpay_payment(UUID);

-- RLS Safety Check: Ensure orders table can only be updated via service role backend functions
-- (Client users cannot arbitrarily alter payment_status or total_amount)
COMMENT ON COLUMN public.orders.razorpay_order_id IS 'Server-authoritative Razorpay Order ID created via backend Netlify function';
COMMENT ON COLUMN public.orders.razorpay_payment_id IS 'Verified Razorpay Payment ID from HMAC-SHA256 signature verification or webhook';
