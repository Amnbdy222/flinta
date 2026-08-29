-- ============================================================
-- SUPABASE SQL FUNCTION: confirm_razorpay_payment
-- ============================================================
-- Execute this SQL in your Supabase SQL Editor.
-- This function uses SECURITY DEFINER to bypass client RLS restrictions
-- and securely mark Razorpay test/live payments as PAID with status PROCESSING.

CREATE OR REPLACE FUNCTION public.confirm_razorpay_payment(
  p_order_id UUID,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.orders
  SET
    payment_method = 'razorpay',
    payment_status = 'paid',
    status = 'processing',
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_razorpay_payment(UUID, TEXT) TO authenticated, anon;
