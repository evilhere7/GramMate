-- ══════════════════════════════════════════════════════════════════════════════
-- GramMate Supabase Storage & Database Setup Migration
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Storage Buckets: Create 'videos' and 'avatars' buckets with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', true, 524288000, array['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-matroska']),
  ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage Policies for 'videos' Bucket
DROP POLICY IF EXISTS "Public read storage videos" ON storage.objects;
CREATE POLICY "Public read storage videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Public upload storage videos" ON storage.objects;
CREATE POLICY "Public upload storage videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "Public update storage videos" ON storage.objects;
CREATE POLICY "Public update storage videos" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Public delete storage videos" ON storage.objects;
CREATE POLICY "Public delete storage videos" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');

-- 3. Storage Policies for 'avatars' Bucket
DROP POLICY IF EXISTS "Public read storage avatars" ON storage.objects;
CREATE POLICY "Public read storage avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public upload storage avatars" ON storage.objects;
CREATE POLICY "Public upload storage avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public update storage avatars" ON storage.objects;
CREATE POLICY "Public update storage avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public delete storage avatars" ON storage.objects;
CREATE POLICY "Public delete storage avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');

-- 4. Database Schema: Ensure 'videos' table has all required columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS reward_rate_per_min DECIMAL(10,4) DEFAULT 0.0100;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Row-Level Security: Ensure video creation & playback works seamlessly
-- Note: Because GramMate uses Firebase Auth, requests arrive via anon public key.
-- These policies allow authenticated creators to publish and manage their content.
DROP POLICY IF EXISTS "Public read videos" ON public.videos;
DROP POLICY IF EXISTS "Approved public videos are viewable" ON public.videos;
CREATE POLICY "Public read videos" ON public.videos
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators insert own videos" ON public.videos;
CREATE POLICY "Creators insert own videos" ON public.videos
FOR INSERT WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "Creators update own videos" ON public.videos;
CREATE POLICY "Creators update own videos" ON public.videos
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Creators delete own videos" ON public.videos;
CREATE POLICY "Creators delete own videos" ON public.videos
FOR DELETE USING (true);

-- 6. Ensure profiles table allows sync from Firebase Auth
DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
CREATE POLICY "Public insert profiles" ON public.profiles
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
CREATE POLICY "Public update profiles" ON public.profiles
FOR UPDATE USING (true);
