import { supabase } from '../lib/supabase';
import { Profile } from '../types/database.types';

// ─── OTP-Based Authentication ─────────────────────────────────────

/**
 * Send a one-time password (OTP) to the user's email.
 * If the user doesn't exist yet, Supabase auto-creates their account.
 */
export async function sendLoginOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Verify the OTP code entered by the user to complete authentication.
 */
export async function verifyLoginOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Resend OTP to the user's email.
 * Uses signInWithOtp again since Supabase's auth.resend() is only for signup confirmation.
 */
export async function resendOtp(email: string) {
  return sendLoginOtp(email);
}

// ─── Legacy password-based auth (kept for backwards compatibility) ─

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

// ─── Profile Management ───────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

export async function ensureProfileExists(
  userId: string,
  fullName?: string,
  phone?: string
): Promise<Profile> {
  const existing = await fetchProfile(userId);
  if (existing) {
    return existing;
  }

  const { data: newProfile, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName || 'Maison Client',
        phone: phone || null,
        role: 'customer',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error || !newProfile) {
    console.error('Error creating customer profile:', error);
    throw new Error(`Unable to initialize customer profile: ${error?.message || 'RLS check failed'}`);
  }

  return newProfile as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; phone?: string; avatar_url?: string }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update profile: ${error?.message}`);
  }

  return data as Profile;
}
