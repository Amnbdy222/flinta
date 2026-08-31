import { supabase } from '../lib/supabase';
import { StoreSettings } from '../types/database.types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: 'FLINT A',
  tagline: 'Premium Fashion & Streetwear',
  support_email: 'support@flintaindia.com',
  support_phone: '+91 98765 43210',
  currency: 'INR',
  currency_symbol: '₹',
  gst_number: null,
  company_address: 'FLINT A India, Studio House, New Delhi, India',
  free_shipping_threshold: 999,
  flat_shipping_rate: 50,
  cod_enabled: true,
  cod_extra_charge: 0,
  return_policy_days: 7,
  exchange_policy_days: 7,
  is_returns_enabled: true,
  is_exchanges_enabled: true,
  announcement_bar_enabled: true,
  announcement_bar_text: 'Free shipping on all orders over ₹999!',
  maintenance_mode: false,
  social_links: {
    instagram: 'https://www.instagram.com/flint_a_india?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==',
    facebook: '',
    twitter: '',
    youtube: '',
  },
  extra_config: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Fetch store settings from Supabase (id = 1).
 * Falls back gracefully to DEFAULT_STORE_SETTINGS if table or row is missing.
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return DEFAULT_STORE_SETTINGS;
    }

    return {
      ...DEFAULT_STORE_SETTINGS,
      ...data,
      social_links: {
        ...DEFAULT_STORE_SETTINGS.social_links,
        ...(data.social_links || {}),
      },
    } as StoreSettings;
  } catch (err) {
    console.warn('Error fetching store_settings:', err);
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Update store settings in Supabase (id = 1).
 */
export async function updateStoreSettings(
  updates: Partial<Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<StoreSettings> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id || null;

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from('store_settings')
    .upsert({ id: 1, ...payload }, { onConflict: 'id' })
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating store_settings:', error);
    throw new Error(error?.message || 'Failed to update store settings.');
  }

  return data as StoreSettings;
}
