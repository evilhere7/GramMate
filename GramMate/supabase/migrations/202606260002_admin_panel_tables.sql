-- Supabase SQL Migration: Admin Panel Tables and Policies
-- Migration ID: 202606260002_admin_panel_tables

-- 1) Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the primary administrator
INSERT INTO public.admins (email) 
VALUES ('evilmc777@gmail.com') 
ON CONFLICT (email) DO NOTHING;

-- 2) Update is_admin function to verify against admins table as well
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    JOIN public.profiles p ON lower(p.email) = lower(a.email)
    WHERE p.id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3) Create admin_logs table (Immutable Audit Logs)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  affected_resource TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4) Create creator_verifications table
CREATE TABLE IF NOT EXISTS public.creator_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB DEFAULT '[]'::jsonb NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5) Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default system configurations
INSERT INTO public.system_settings (key, value) VALUES
  ('maintenance_mode', 'false'::jsonb),
  ('registration_enabled', 'true'::jsonb),
  ('max_upload_size_mb', '1000'::jsonb),
  ('allowed_formats', '["mp4", "mov", "webm"]'::jsonb),
  ('feed_algorithm', '"trending"'::jsonb),
  ('platform_name', '"GramMate"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6) Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'report', 'failed_auth', 'verification_request', 'db_error', 'spike'
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7) Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 8) Configure Policies
-- Admins policies
CREATE POLICY "Admins: admin operations" ON public.admins
  FOR ALL USING (public.is_admin());

-- Admin Logs (no UPDATE/DELETE policies to ensure audit trail immutability)
CREATE POLICY "Admin Logs: read access" ON public.admin_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin Logs: write access" ON public.admin_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Creator Verifications
CREATE POLICY "Verifications: select own" ON public.creator_verifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Verifications: insert own" ON public.creator_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Verifications: manage" ON public.creator_verifications
  FOR ALL USING (public.is_admin());

-- System Settings
CREATE POLICY "Settings: read public" ON public.system_settings
  FOR SELECT USING (true);
CREATE POLICY "Settings: write admin" ON public.system_settings
  FOR ALL USING (public.is_admin());

-- Admin Notifications
CREATE POLICY "Notifications: manage" ON public.admin_notifications
  FOR ALL USING (public.is_admin());

-- 9) Creator auto-verification trigger sync (when request approved, set is_verified in profiles)
CREATE OR REPLACE FUNCTION public.sync_creator_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles
    SET is_verified = true, role = 'creator'
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles
    SET is_verified = false
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_creator_verification_updated
  AFTER UPDATE OF status ON public.creator_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_creator_verification();
