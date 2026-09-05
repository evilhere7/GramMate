-- ══════════════════════════════════════════════════════════════════════════════
-- GramMate Production Supabase Database Schema & Security Migration
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUM TYPES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('viewer', 'creator', 'admin', 'moderator');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_visibility') THEN
    CREATE TYPE public.video_visibility AS ENUM ('public', 'unlisted', 'private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected', 'removed');
  END IF;
END $$;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'viewer' NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  following_count INTEGER DEFAULT 0 NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'General' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public' NOT NULL,
  moderation_status TEXT DEFAULT 'approved' NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  shares_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. LIKES TABLE
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, video_id)
);

-- 6. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance_cents INTEGER DEFAULT 0 NOT NULL,
  pending_cents INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ADMINS TABLE (Restricted strictly to evilmc777@gmail.com)
CREATE TABLE IF NOT EXISTS public.admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admins (email) 
VALUES ('evilmc777@gmail.com') 
ON CONFLICT (email) DO NOTHING;

-- 9. REPORTS / MODERATION TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- 10. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', true, 524288000, array['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm']),
  ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
CREATE POLICY "Allow profile insert" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow profile update" ON public.profiles;
CREATE POLICY "Allow profile update" ON public.profiles FOR UPDATE USING (true);

-- Videos Policies
DROP POLICY IF EXISTS "Public videos are viewable" ON public.videos;
CREATE POLICY "Public videos are viewable" ON public.videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow video insert" ON public.videos;
CREATE POLICY "Allow video insert" ON public.videos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow video delete" ON public.videos;
CREATE POLICY "Allow video delete" ON public.videos FOR DELETE USING (true);

-- Comments Policies
DROP POLICY IF EXISTS "Comments are viewable" ON public.comments;
CREATE POLICY "Comments are viewable" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow comment insert" ON public.comments;
CREATE POLICY "Allow comment insert" ON public.comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow comment delete" ON public.comments;
CREATE POLICY "Allow comment delete" ON public.comments FOR DELETE USING (true);

-- Likes Policies
DROP POLICY IF EXISTS "Likes are viewable" ON public.likes;
CREATE POLICY "Likes are viewable" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow like insert" ON public.likes;
CREATE POLICY "Allow like insert" ON public.likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow like delete" ON public.likes;
CREATE POLICY "Allow like delete" ON public.likes FOR DELETE USING (true);

-- Wallets & Transactions Policies
DROP POLICY IF EXISTS "Wallets are readable" ON public.wallets;
CREATE POLICY "Wallets are readable" ON public.wallets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow wallet update" ON public.wallets;
CREATE POLICY "Allow wallet update" ON public.wallets FOR ALL USING (true);

DROP POLICY IF EXISTS "Transactions are readable" ON public.transactions;
CREATE POLICY "Transactions are readable" ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow transaction insert" ON public.transactions;
CREATE POLICY "Allow transaction insert" ON public.transactions FOR INSERT WITH CHECK (true);

-- Reports Policies
DROP POLICY IF EXISTS "Reports are viewable" ON public.reports;
CREATE POLICY "Reports are viewable" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow report insert" ON public.reports;
CREATE POLICY "Allow report insert" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow report update" ON public.reports;
CREATE POLICY "Allow report update" ON public.reports FOR UPDATE USING (true);

-- Admins Table Policy (Read-only check)
DROP POLICY IF EXISTS "Admins table read" ON public.admins;
CREATE POLICY "Admins table read" ON public.admins FOR SELECT USING (true);

-- Storage Policies
DROP POLICY IF EXISTS "Public read storage videos" ON storage.objects;
CREATE POLICY "Public read storage videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Public upload storage videos" ON storage.objects;
CREATE POLICY "Public upload storage videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "Public read storage avatars" ON storage.objects;
CREATE POLICY "Public read storage avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public upload storage avatars" ON storage.objects;
CREATE POLICY "Public upload storage avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
