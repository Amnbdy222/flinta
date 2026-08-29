-- ============================================================================
-- FLINT STOREFRONT — CONTACT INQUIRIES DATABASE TABLE & POLICIES
-- ============================================================================
-- Execute this script in your Supabase SQL Editor (https://app.supabase.com)
-- to enable contact form submissions with Row Level Security (RLS).
-- ============================================================================

-- 1. Create table for contact inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'in_progress', 'resolved')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast lookup & sorting
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Allow anyone (guest or logged-in user) to submit a contact inquiry
DROP POLICY IF EXISTS "Allow public insert to contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow public insert to contact_inquiries"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (true);

-- 5. RLS Policy: Allow users to view their own submitted inquiries
DROP POLICY IF EXISTS "Allow users to view own inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow users to view own inquiries"
  ON public.contact_inquiries
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id) 
    OR (auth.jwt() ->> 'role' = 'service_role')
  );
