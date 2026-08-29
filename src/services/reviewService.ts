import { supabase } from '../lib/supabase';
import { Review } from '../types/database.types';

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
}

export interface CreateReviewInput {
  product_id: string;
  order_id?: string | null;
  rating: number;
  title?: string;
  comment?: string;
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    // Fetch approved reviews, or user's own pending/approved reviews
    let query = supabase
      .from('reviews')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (currentUserId) {
      query = query.or(`status.eq.approved,user_id.eq.${currentUserId}`);
    } else {
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }

    return (data || []) as Review[];
  } catch (err) {
    console.error('Unexpected error fetching reviews:', err);
    return [];
  }
}

export async function fetchRatingSummary(productId: string): Promise<RatingSummary> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .neq('status', 'rejected');

    if (error || !data || data.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const totalReviews = data.length;
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    data.forEach((r) => {
      const val = Number(r.rating) || 0;
      if (val >= 1 && val <= 5) {
        ratingCounts[val] = (ratingCounts[val] || 0) + 1;
        sum += val;
      }
    });

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      ratingCounts,
    };
  } catch (err) {
    console.error('Unexpected error fetching rating summary:', err);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
}

export interface ReviewEligibility {
  canReview: boolean;
  eligibleOrderId?: string;
  reason?: string;
}

export async function checkUserReviewEligibility(productId: string): Promise<ReviewEligibility> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      return {
        canReview: false,
        reason: 'Please sign in to write a product review.',
      };
    }

    // 1. Check if user already submitted a review for this product
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, status')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingReview) {
      return {
        canReview: false,
        reason:
          existingReview.status === 'pending'
            ? 'Your review for this garment has been submitted and is currently awaiting admin approval.'
            : 'You have already submitted a review for this garment.',
      };
    }

    // 2. Query user's orders containing this product
    const { data: matchingOrders, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, order_items!inner(product_id)')
      .eq('user_id', user.id)
      .eq('order_items.product_id', productId);

    if (orderErr || !matchingOrders || matchingOrders.length === 0) {
      return {
        canReview: false,
        reason: 'Only verified purchasers of this garment can write a review.',
      };
    }

    return {
      canReview: true,
      eligibleOrderId: matchingOrders[0].id,
    };
  } catch (err) {
    console.error('Error checking review eligibility:', err);
    return {
      canReview: false,
      reason: 'Failed to verify purchase history. Please try again.',
    };
  }
}

export async function submitReview(input: CreateReviewInput): Promise<Review> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    throw new Error('Please sign in to submit a client review.');
  }

  // Verify purchase eligibility and get verified order_id
  const eligibility = await checkUserReviewEligibility(input.product_id);
  if (!eligibility.canReview) {
    throw new Error(eligibility.reason || 'Only verified purchasers can submit a review.');
  }

  // Ensure matching profile exists before foreign key insert
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client',
      updated_at: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: input.product_id,
      user_id: user.id,
      order_id: input.order_id || eligibility.eligibleOrderId || null,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
      status: 'pending',
    })
    .select('*, profiles:user_id(full_name, avatar_url)')
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    if (error.code === '23505') {
      throw new Error('You have already submitted a review for this garment.');
    }
    if (error.message?.includes('verify_purchased_product_review') || error.code === 'P0001') {
      throw new Error('Only verified purchasers of this garment can write a review.');
    }
    throw new Error(error.message || 'Failed to submit review.');
  }

  return data as Review;
}
