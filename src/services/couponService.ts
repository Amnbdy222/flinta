import { supabase } from '../lib/supabase';
import { Coupon } from '../types/database.types';

export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon | null;
  discountAmount: number;
  message: string;
}

// Fetch all active, valid coupons from Supabase public.coupons table
export async function fetchActiveCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching active coupons from database:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter unexpired and active coupons client-side
    const now = new Date();
    const validCoupons = data.filter((c: Coupon) => {
      if (c.starts_at && new Date(c.starts_at) > now) return false;
      if (c.expires_at && new Date(c.expires_at) < now) return false;
      return true;
    });

    return validCoupons;
  } catch (err) {
    console.error('Error fetching active coupons:', err);
    return [];
  }
}

// Record coupon usage in public.coupon_usage table
export async function recordCouponUsage(
  couponId: string,
  orderId: string,
  discountAmount: number,
  userId?: string | null,
  sessionId?: string | null
): Promise<void> {
  if (!couponId || couponId.startsWith('mock-') || !orderId) {
    return;
  }

  try {
    const { error } = await supabase.from('coupon_usage').insert({
      coupon_id: couponId,
      user_id: userId || null,
      order_id: orderId,
      discount_amount: discountAmount,
      session_id: sessionId || null,
    });

    if (error && error.code !== '23505') {
      console.warn('Coupon usage insert note:', error.message);
    }
  } catch (err) {
    console.warn('Coupon usage recording exception:', err);
  }
}

// Validate coupon code & calculate exact discount amount with usage limit checking
export async function validateAndCalculateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      coupon: null,
      discountAmount: 0,
      message: 'PLEASE ENTER A PROMO CODE.',
    };
  }

  // Fetch live active coupons
  const activeCoupons = await fetchActiveCoupons();
  const coupon = activeCoupons.find(
    (c) => c.code.trim().toUpperCase() === cleanCode
  );

  if (!coupon) {
    return {
      valid: false,
      coupon: null,
      discountAmount: 0,
      message: `PROMO CODE "${cleanCode}" IS INVALID OR EXPIRED.`,
    };
  }

  if (subtotal < coupon.minimum_order_value) {
    return {
      valid: false,
      coupon,
      discountAmount: 0,
      message: `ADD ₹${(coupon.minimum_order_value - subtotal).toFixed(
        2
      )} MORE TO QUALIFY FOR THIS COUPON (MIN ₹${coupon.minimum_order_value}).`,
    };
  }

  // Check usage_limit & per_user_limit against public.coupon_usage
  if (coupon.id && !coupon.id.startsWith('mock-')) {
    try {
      // 1. Check global usage_limit
      if (coupon.usage_limit && coupon.usage_limit > 0) {
        const { count } = await supabase
          .from('coupon_usage')
          .select('id', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id);

        if (count !== null && count >= coupon.usage_limit) {
          return {
            valid: false,
            coupon,
            discountAmount: 0,
            message: `PROMO CODE "${cleanCode}" MAXIMUM USAGE LIMIT HAS BEEN REACHED.`,
          };
        }
      }

      // 2. Check per_user_limit
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      if (currentUserId && coupon.per_user_limit && coupon.per_user_limit > 0) {
        const { count: userCount } = await supabase
          .from('coupon_usage')
          .select('id', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', currentUserId);

        if (userCount !== null && userCount >= coupon.per_user_limit) {
          return {
            valid: false,
            coupon,
            discountAmount: 0,
            message: `YOU HAVE ALREADY REDEEMED PROMO CODE "${cleanCode}".`,
          };
        }
      }
    } catch (checkErr) {
      console.warn('Usage limit check warning:', checkErr);
    }
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
    if (coupon.maximum_discount && coupon.maximum_discount > 0) {
      discount = Math.min(discount, coupon.maximum_discount);
    }
  } else {
    discount = Math.min(coupon.discount_value, subtotal);
  }

  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    coupon,
    discountAmount: discount,
    message: `COUPON "${coupon.code}" APPLIED! SAVED ₹${discount.toFixed(2)}.`,
  };
}
