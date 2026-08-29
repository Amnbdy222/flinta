import { supabase } from '../lib/supabase';
import { FormattedProduct, Product } from '../types/database.types';
import { formatProduct } from './productService';

const GUEST_WISHLIST_KEY = 'flint_guest_wishlist';

// Retrieve guest wishlist IDs from localStorage
function getGuestWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save guest wishlist IDs to localStorage
function saveGuestWishlistIds(ids: string[]): void {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving guest wishlist:', err);
  }
}

// Merge guest local wishlist items into user's DB wishlist on authentication
export async function mergeGuestWishlist(userId: string): Promise<void> {
  const guestIds = getGuestWishlistIds();
  if (guestIds.length === 0) return;

  try {
    const dbIds = await fetchWishlistIds(userId);
    const uniqueToInsert = guestIds.filter((id) => !dbIds.includes(id));

    for (const pid of uniqueToInsert) {
      await supabase.from('wishlist_items').insert({
        user_id: userId,
        product_id: pid,
      });
    }
  } catch (err) {
    console.warn('Error merging guest wishlist:', err);
  } finally {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  }
}

export async function fetchWishlistIds(userId?: string): Promise<string[]> {
  if (!userId) {
    return getGuestWishlistIds();
  }

  try {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error fetching authenticated wishlist:', error);
      return getGuestWishlistIds();
    }

    return data.map((item) => item.product_id);
  } catch (err) {
    console.error('Unexpected error in fetchWishlistIds:', err);
    return getGuestWishlistIds();
  }
}

export async function addWishlistItem(productId: string, userId?: string): Promise<void> {
  if (!userId) {
    const current = getGuestWishlistIds();
    if (!current.includes(productId)) {
      saveGuestWishlistIds([...current, productId]);
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: userId,
        product_id: productId,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key constraint
      console.error('Error adding to wishlist DB:', error);
    }
  } catch (err) {
    console.error('Unexpected error adding to wishlist:', err);
  }
}

export async function removeWishlistItem(productId: string, userId?: string): Promise<void> {
  if (!userId) {
    const current = getGuestWishlistIds();
    saveGuestWishlistIds(current.filter((id) => id !== productId));
    return;
  }

  try {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from wishlist DB:', error);
    }
  } catch (err) {
    console.error('Unexpected error removing from wishlist:', err);
  }
}

export async function fetchWishlistProducts(userId?: string): Promise<FormattedProduct[]> {
  const ids = await fetchWishlistIds(userId);
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .in('id', ids)
      .eq('status', 'active');

    if (error || !data) {
      console.error('Error fetching wishlist product objects:', error);
      return [];
    }

    return data.map((item, idx) => formatProduct(item as Product, idx));
  } catch (err) {
    console.error('Unexpected error in fetchWishlistProducts:', err);
    return [];
  }
}
