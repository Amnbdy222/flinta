import { supabase } from '../lib/supabase';
import { StorefrontBanner, BannerType } from '../types/database.types';
import { cachedQuery } from './cacheService';

const BANNERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchStorefrontBanners(bannerType?: BannerType): Promise<StorefrontBanner[]> {
  const cacheKey = `storefront_banners_${bannerType || 'all'}`;

  return cachedQuery(cacheKey, BANNERS_CACHE_TTL, async () => {
    try {
      let query = supabase
        .from('storefront_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (bannerType) {
        query = query.eq('banner_type', bannerType);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching storefront banners:', error.message);
        return [];
      }

      return (data || []) as StorefrontBanner[];
    } catch (err) {
      console.error('Unexpected error fetching banners:', err);
      return [];
    }
  });
}

