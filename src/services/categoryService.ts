import { supabase } from '../lib/supabase';
import { Category } from '../types/database.types';
import { cachedQuery } from './cacheService';

const CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active categories from Supabase, sorted by sort_order ascending
 * Wrapped in client in-memory cache for instant subsequent page renders.
 */
export async function fetchActiveCategories(): Promise<Category[]> {
  return cachedQuery('storefront_active_categories', CATEGORIES_CACHE_TTL, async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('[categoryService] Error fetching categories:', error);
        return [];
      }

      return (data || []) as Category[];
    } catch (err) {
      console.error('[categoryService] Unexpected error fetching categories:', err);
      return [];
    }
  });
}

