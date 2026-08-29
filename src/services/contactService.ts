import { supabase } from '../lib/supabase';

export interface ContactInquiryPayload {
  fullName: string;
  email: string;
  topic: string;
  message: string;
}

/**
 * Submits a client inquiry to Supabase `contact_inquiries` table.
 */
export async function submitContactInquiry(payload: ContactInquiryPayload): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id || null;

  const { error } = await supabase.from('contact_inquiries').insert({
    full_name: payload.fullName.trim(),
    email: payload.email.trim(),
    topic: payload.topic,
    message: payload.message.trim(),
    user_id: userId,
  });

  if (error) {
    console.error('Failed to submit contact inquiry:', error);
    throw new Error(error.message || 'Unable to submit your inquiry. Please try again.');
  }
}
