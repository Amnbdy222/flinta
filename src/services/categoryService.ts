import { supabase } from '../lib/supabase';
import { Category } from '../types/database.types';

/**
 * Fetch all active categories from Supabase, sorted by sort_order ascending
 */
export async function fetchActiveCategories(): Promise<Category[]> {
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
}
