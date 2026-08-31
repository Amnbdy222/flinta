-- ==============================================================================
-- FLINT STOREFRONT: Coupon-Integrated place_cod_order Migration
-- ==============================================================================
-- Run this ENTIRE script in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ==============================================================================
--
-- This migration REPLACES the existing place_cod_order function with a new
-- version that accepts an optional p_coupon_code parameter.
--
-- The entire checkout transaction is atomic:
--   authenticate → validate cart → lock cart → validate items → lock variants
--   → calculate subtotal → validate coupon → calculate discount → calculate total
--   → INSERT order → INSERT order_items → decrement stock → INSERT coupon_usage
--   → convert cart → COMMIT
--
-- If ANY step fails, the entire transaction is rolled back.
--
-- NO new RLS policies are created for customer UPDATE on orders.
-- NO new RLS policies expose coupon_usage globally.
-- All coupon validation and coupon_usage insertion happens inside this
-- SECURITY DEFINER function using auth.uid(), not frontend-supplied values.
-- ==============================================================================


CREATE OR REPLACE FUNCTION public.place_cod_order(
  p_cart_id          UUID,
  p_guest_session_id TEXT    DEFAULT '',
  p_shipping_name    TEXT    DEFAULT '',
  p_shipping_phone   TEXT    DEFAULT '',
  p_shipping_address_line_1 TEXT DEFAULT '',
  p_shipping_address_line_2 TEXT DEFAULT '',
  p_shipping_city    TEXT    DEFAULT '',
  p_shipping_state   TEXT    DEFAULT '',
  p_shipping_pincode TEXT    DEFAULT '',
  p_coupon_code      TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id          UUID;
  v_cart             RECORD;
  v_item             RECORD;
  v_variant          RECORD;
  v_product          RECORD;
  v_subtotal            NUMERIC(10,2) := 0;
  v_shipping_amount     NUMERIC(10,2) := 0;
  v_free_thresh         NUMERIC(10,2);
  v_flat_shipping       NUMERIC(10,2);
  v_discount            NUMERIC(10,2) := 0;
  v_total               NUMERIC(10,2);
  v_order_id         UUID;
  v_order_number     TEXT;
  v_coupon           RECORD;
  v_coupon_id        UUID := NULL;
  v_clean_code       TEXT;
  v_usage_count      INT;
  v_user_usage_count INT;
  v_session_id       TEXT;
BEGIN
  -- ============================================================
  -- 1. AUTHENTICATE: Require signed-in user via auth.uid()
  -- ============================================================
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated: You must be signed in to complete checkout.'
      USING ERRCODE = 'P0001';
  END IF;

  -- ============================================================
  -- 2. VALIDATE CART OWNERSHIP & LOCK CART ROW
  -- ============================================================
  SELECT id, user_id, session_id, status
    INTO v_cart
    FROM carts
    WHERE id = p_cart_id
    FOR UPDATE;  -- Row-level lock prevents concurrent checkout on same cart

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found. Please add garments to your shopping bag.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Ownership check: cart must belong to this user OR be an unclaimed guest cart
  IF v_cart.user_id IS NOT NULL AND v_cart.user_id != v_user_id THEN
    RAISE EXCEPTION 'Security: This cart does not belong to your account.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Prevent double-checkout
  IF v_cart.status != 'active' THEN
    RAISE EXCEPTION 'This cart has already been converted to an order.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Claim guest cart for this user if not yet claimed
  IF v_cart.user_id IS NULL THEN
    UPDATE carts SET user_id = v_user_id WHERE id = p_cart_id;
  END IF;

  -- Store session_id for coupon_usage
  v_session_id := COALESCE(v_cart.session_id, p_guest_session_id, 'checkout');

  -- ============================================================
  -- 3. VALIDATE CART ITEMS & LOCK PRODUCT VARIANTS
  -- ============================================================
  -- Calculate authoritative subtotal from DB prices (NOT frontend)
  FOR v_item IN
    SELECT ci.id AS cart_item_id,
           ci.product_id,
           ci.variant_id,
           ci.quantity
      FROM cart_items ci
      WHERE ci.cart_id = p_cart_id
  LOOP
    -- Lock the variant row to prevent concurrent stock modifications
    SELECT pv.id, pv.product_id, pv.price, pv.stock, pv.status,
           pv.color_name, pv.size, pv.sku
      INTO v_variant
      FROM product_variants pv
      WHERE pv.id = v_item.variant_id
      FOR UPDATE;

    IF NOT FOUND OR v_variant.status != 'active' THEN
      RAISE EXCEPTION 'Product variant is no longer available.'
        USING ERRCODE = 'P0001';
    END IF;

    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for variant %. Only % available.',
        v_variant.sku, v_variant.stock
        USING ERRCODE = 'P0001';
    END IF;

    -- Fetch product name for snapshot
    SELECT p.name INTO v_product
      FROM products p
      WHERE p.id = v_item.product_id;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  END LOOP;

  -- Verify cart is not empty
  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Your shopping bag is empty.'
      USING ERRCODE = 'P0001';
  END IF;

  -- ============================================================
  -- 4. VALIDATE COUPON & CALCULATE AUTHORITATIVE DISCOUNT
  -- ============================================================
  v_clean_code := UPPER(TRIM(COALESCE(p_coupon_code, '')));

  IF v_clean_code != '' THEN
    -- Load coupon from database (server-authoritative)
    SELECT c.id, c.code, c.discount_type, c.discount_value,
           c.minimum_order_value, c.maximum_discount,
           c.usage_limit, c.per_user_limit,
           c.starts_at, c.expires_at, c.is_active
      INTO v_coupon
      FROM coupons c
      WHERE c.code = v_clean_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promo code "%" is invalid or does not exist.', v_clean_code
        USING ERRCODE = 'P0001';
    END IF;

    -- Active status
    IF NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'Promo code "%" is no longer active.', v_clean_code
        USING ERRCODE = 'P0001';
    END IF;

    -- Date validity
    IF v_coupon.starts_at > NOW() THEN
      RAISE EXCEPTION 'Promo code "%" is not yet active.', v_clean_code
        USING ERRCODE = 'P0001';
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      RAISE EXCEPTION 'Promo code "%" has expired.', v_clean_code
        USING ERRCODE = 'P0001';
    END IF;

    -- Minimum order value
    IF v_subtotal < v_coupon.minimum_order_value THEN
      RAISE EXCEPTION 'Subtotal ₹% does not meet the minimum ₹% for "%".',
        v_subtotal, v_coupon.minimum_order_value, v_clean_code
        USING ERRCODE = 'P0001';
    END IF;

    -- Global usage limit check with advisory lock for concurrency safety
    -- The advisory lock key is derived from the coupon ID to prevent two
    -- concurrent checkouts from both passing the count check.
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_limit > 0 THEN
      -- Acquire an advisory lock scoped to this coupon's usage count check.
      -- hashtext() converts the UUID to a stable int4 for pg_advisory_xact_lock.
      PERFORM pg_advisory_xact_lock(hashtext(v_coupon.id::text));

      SELECT COUNT(*) INTO v_usage_count
        FROM coupon_usage cu
        WHERE cu.coupon_id = v_coupon.id;

      IF v_usage_count >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'Promo code "%" maximum usage limit has been reached.', v_clean_code
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Per-user usage limit check (also serialized by the advisory lock above)
    IF v_coupon.per_user_limit IS NOT NULL AND v_coupon.per_user_limit > 0 THEN
      -- If we didn't already acquire the advisory lock (no global usage_limit),
      -- acquire it now for the per-user check.
      IF v_coupon.usage_limit IS NULL OR v_coupon.usage_limit <= 0 THEN
        PERFORM pg_advisory_xact_lock(hashtext(v_coupon.id::text));
      END IF;

      SELECT COUNT(*) INTO v_user_usage_count
        FROM coupon_usage cu
        WHERE cu.coupon_id = v_coupon.id AND cu.user_id = v_user_id;

      IF v_user_usage_count >= v_coupon.per_user_limit THEN
        RAISE EXCEPTION 'You have already redeemed promo code "%".', v_clean_code
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Calculate discount (server-authoritative)
    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := (v_subtotal * v_coupon.discount_value) / 100;
      IF v_coupon.maximum_discount IS NOT NULL AND v_coupon.maximum_discount > 0 THEN
        v_discount := LEAST(v_discount, v_coupon.maximum_discount);
      END IF;
    ELSE
      -- 'fixed' discount
      v_discount := v_coupon.discount_value;
    END IF;

    -- Cap discount at subtotal (cannot go negative)
    v_discount := LEAST(v_discount, v_subtotal);
    v_discount := ROUND(v_discount, 2);

    v_coupon_id := v_coupon.id;
  END IF;

  -- ============================================================
  -- 5. CALCULATE DYNAMIC SHIPPING AMOUNT FROM STORE SETTINGS & FINAL TOTAL
  -- ============================================================
  SELECT free_shipping_threshold, flat_shipping_rate
    INTO v_free_thresh, v_flat_shipping
    FROM store_settings
    WHERE id = 1;

  IF v_free_thresh IS NOT NULL AND v_subtotal >= v_free_thresh THEN
    v_shipping_amount := 0;
  ELSIF v_flat_shipping IS NOT NULL THEN
    v_shipping_amount := v_flat_shipping;
  ELSIF v_subtotal >= 999 THEN
    v_shipping_amount := 0;
  ELSE
    v_shipping_amount := 50;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping_amount);

  -- ============================================================
  -- 6. GENERATE ORDER NUMBER & INSERT ORDER
  -- ============================================================
  v_order_number := 'FL-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

  INSERT INTO orders (
    order_number,
    user_id,
    status,
    payment_method,
    payment_status,
    subtotal,
    discount_amount,
    shipping_amount,
    total_amount,
    coupon_id,
    shipping_name,
    shipping_phone,
    shipping_address_line_1,
    shipping_address_line_2,
    shipping_city,
    shipping_state,
    shipping_pincode
  ) VALUES (
    v_order_number,
    v_user_id,
    'pending',
    'cod',
    'pending',
    v_subtotal,
    v_discount,
    v_shipping_amount,
    v_total,
    v_coupon_id,
    TRIM(p_shipping_name),
    TRIM(p_shipping_phone),
    TRIM(p_shipping_address_line_1),
    TRIM(COALESCE(p_shipping_address_line_2, '')),
    TRIM(p_shipping_city),
    TRIM(p_shipping_state),
    TRIM(p_shipping_pincode)
  )
  RETURNING id INTO v_order_id;

  -- ============================================================
  -- 7. INSERT ORDER ITEMS (with product/variant snapshots)
  -- ============================================================
  INSERT INTO order_items (
    order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    color_name_snapshot,
    size_snapshot,
    sku_snapshot,
    unit_price,
    quantity,
    total_price
  )
  SELECT
    v_order_id,
    ci.product_id,
    ci.variant_id,
    COALESCE(p.name, 'Garment'),
    COALESCE(pv.color_name, 'Standard'),
    COALESCE(pv.size, 'M'),
    COALESCE(pv.sku, 'SKU-UNKNOWN'),
    pv.price,
    ci.quantity,
    pv.price * ci.quantity
  FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  -- ============================================================
  -- 8. DECREMENT INVENTORY (already locked via FOR UPDATE above)
  -- ============================================================
  UPDATE product_variants pv
    SET stock = GREATEST(0, pv.stock - ci.quantity),
        updated_at = NOW()
    FROM cart_items ci
    WHERE ci.cart_id = p_cart_id
      AND pv.id = ci.variant_id;

  -- ============================================================
  -- 9. INSERT COUPON USAGE (same transaction — atomic)
  -- ============================================================
  IF v_coupon_id IS NOT NULL AND v_discount > 0 THEN
    INSERT INTO coupon_usage (
      coupon_id,
      user_id,
      order_id,
      discount_amount,
      session_id
    ) VALUES (
      v_coupon_id,
      v_user_id,
      v_order_id,
      v_discount,
      v_session_id
    );
  END IF;

  -- ============================================================
  -- 10. CONVERT CART (mark as converted, clear items)
  -- ============================================================
  DELETE FROM cart_items WHERE cart_id = p_cart_id;

  UPDATE carts
    SET status = 'converted',
        user_id = v_user_id,
        updated_at = NOW()
    WHERE id = p_cart_id;

  -- ============================================================
  -- 11. RETURN ORDER DATA
  -- ============================================================
  RETURN jsonb_build_object(
    'id',                     v_order_id,
    'order_number',           v_order_number,
    'user_id',                v_user_id,
    'status',                 'pending',
    'payment_method',         'cod',
    'payment_status',         'pending',
    'subtotal',               v_subtotal,
    'discount_amount',        v_discount,
    'shipping_amount',        v_shipping_amount,
    'total_amount',           v_total,
    'coupon_id',              v_coupon_id,
    'shipping_name',          TRIM(p_shipping_name),
    'shipping_phone',         TRIM(p_shipping_phone),
    'shipping_address_line_1', TRIM(p_shipping_address_line_1),
    'shipping_address_line_2', TRIM(COALESCE(p_shipping_address_line_2, '')),
    'shipping_city',          TRIM(p_shipping_city),
    'shipping_state',         TRIM(p_shipping_state),
    'shipping_pincode',       TRIM(p_shipping_pincode),
    'created_at',             NOW(),
    'updated_at',             NOW()
  );
END;
$$;

-- ============================================================
-- PERMISSIONS
-- ============================================================
-- Revoke from everyone, then grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.place_cod_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.place_cod_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;


-- ============================================================
-- CLEANUP: Drop the previous (9-parameter) function signature
--          if it exists, so stale callers get a clear error.
-- ============================================================
-- The new function has 10 parameters (added p_coupon_code with DEFAULT).
-- PostgreSQL treats different argument lists as separate overloads.
-- Drop the old 9-arg overload if it exists to avoid ambiguity.
DROP FUNCTION IF EXISTS public.place_cod_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);

-- Also drop the separate apply_coupon_to_order function if it was
-- created from the previous migration attempt.
DROP FUNCTION IF EXISTS public.apply_coupon_to_order(UUID, TEXT);


-- ============================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ============================================================
-- SELECT proname, pronargs, proargnames
--   FROM pg_proc
--   WHERE proname = 'place_cod_order';
--
-- SELECT COUNT(*) FROM pg_proc WHERE proname = 'apply_coupon_to_order';
--
-- -- Test: Should return error "Unauthenticated..."
-- SELECT public.place_cod_order(
--   'a0000000-0000-0000-0000-000000000000'::uuid,
--   '', '', '', '', '', '', '', '', NULL
-- );
