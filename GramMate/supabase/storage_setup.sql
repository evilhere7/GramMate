-- ══════════════════════════════════════════════════════════════════════════════
-- GramMate Supabase Storage & Database Setup Migration
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure the storage buckets exist with public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage policies for the videos bucket.
DROP POLICY IF EXISTS "Videos are publicly readable" ON storage.objects;
CREATE POLICY "Videos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Users upload own videos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload storage videos" ON storage.objects;
CREATE POLICY "Users upload own videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

DROP POLICY IF EXISTS "Users update own videos" ON storage.objects;
CREATE POLICY "Users update own videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'videos'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

DROP POLICY IF EXISTS "Users delete own videos" ON storage.objects;
CREATE POLICY "Users delete own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'videos'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon')
  )
);

-- 3. Storage policies for avatars bucket.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public upload storage avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
CREATE POLICY "Users delete own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    (auth.role() = 'authenticated' AND lower(split_part(name, '/', 1)) = lower(auth.uid()::text))
    OR (auth.role() = 'anon')
  )
);

-- 4. Ensure public.videos columns and policies
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS reward_rate_per_min DECIMAL(10,4) DEFAULT 0.0100;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read videos" ON public.videos;
CREATE POLICY "Public read videos"
ON public.videos
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video insert" ON public.videos;
CREATE POLICY "Users insert own videos"
ON public.videos
FOR INSERT
WITH CHECK (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id
  ))
);

DROP POLICY IF EXISTS "Users update own videos" ON public.videos;
CREATE POLICY "Users update own videos"
ON public.videos
FOR UPDATE
USING (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon')
);

DROP POLICY IF EXISTS "Users delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video delete" ON public.videos;
CREATE POLICY "Users delete own videos"
ON public.videos
FOR DELETE
USING (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon')
);

-- 5. Ensure public.profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  (auth.role() = 'authenticated' AND id = auth.uid())
  OR (auth.role() = 'anon' AND id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile update" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (
  (auth.role() = 'authenticated' AND id = auth.uid())
  OR (auth.role() = 'anon')
);

-- 6. Ensure comments & likes policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable" ON public.comments;
CREATE POLICY "Comments are viewable" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Allow comment insert" ON public.comments;
CREATE POLICY "Users insert own comments" ON public.comments FOR INSERT WITH CHECK (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
);

DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Allow comment delete" ON public.comments;
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon')
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable" ON public.likes;
CREATE POLICY "Likes are viewable" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Allow like insert" ON public.likes;
CREATE POLICY "Users insert own likes" ON public.likes FOR INSERT WITH CHECK (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
);

DROP POLICY IF EXISTS "Users delete own likes" ON public.likes;
DROP POLICY IF EXISTS "Allow like delete" ON public.likes;
CREATE POLICY "Users delete own likes" ON public.likes FOR DELETE USING (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon')
);
