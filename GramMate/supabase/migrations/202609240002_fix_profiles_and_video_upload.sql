-- ══════════════════════════════════════════════════════════════════════════════
-- GramMate Migration 202609240002: Fix Profiles & Video Upload Architecture
-- Idempotent, non-destructive migration that establishes public.profiles,
-- removes obsolete auth.users foreign key constraint for Firebase Auth users,
-- and configures storage and video RLS policies.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure public.profiles table exists with the exact schema needed by GramMate
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  website TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add any missing columns to public.profiles safely (additive only)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. CRITICAL: Remove foreign key referencing auth.users(id)
-- GramMate authenticates users via Firebase Auth. User UIDs are mapped to UUIDs
-- and stored directly in public.profiles. They do NOT exist in Supabase auth.users.
-- Dropping this constraint allows Firebase-authenticated creators to exist in public.profiles.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. Fill in defaults for existing rows safely
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL AND full_name IS NOT NULL;
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;

-- 5. Safe indexes on profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(lower(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 6. Ensure public.videos table exists and matches application columns
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public',
  processing_status TEXT NOT NULL DEFAULT 'ready',
  moderation_status TEXT NOT NULL DEFAULT 'approved',
  reward_rate_per_min DECIMAL(10,4) NOT NULL DEFAULT 0.0100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all required columns exist on public.videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS reward_rate_per_min DECIMAL(10,4) DEFAULT 0.0100;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

UPDATE public.videos SET creator_id = user_id WHERE creator_id IS NULL AND user_id IS NOT NULL;
UPDATE public.videos SET user_id = creator_id WHERE user_id IS NULL AND creator_id IS NOT NULL;

-- 7. Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 8. Storage RLS policies for 'videos' bucket
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
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

-- 9. Storage RLS policies for 'avatars' bucket
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
    OR (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id::text = split_part(name, '/', 1)
    ))
  )
);

-- 10. Database RLS policies for public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: select" ON public.profiles;
CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert own" ON public.profiles;
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  (auth.role() = 'authenticated' AND id = auth.uid())
  OR (auth.role() = 'anon' AND id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (
  (auth.role() = 'authenticated' AND id = auth.uid())
  OR (auth.role() = 'anon')
);

-- 11. Database RLS policies for public.videos
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
  OR (auth.role() = 'anon' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id
  ))
);

DROP POLICY IF EXISTS "Users delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video delete" ON public.videos;
CREATE POLICY "Users delete own videos"
ON public.videos
FOR DELETE
USING (
  (auth.role() = 'authenticated' AND user_id = auth.uid())
  OR (auth.role() = 'anon' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id
  ))
);

-- 12. Database RLS policies for public.comments and public.likes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Comments are viewable" ON public.comments;
    CREATE POLICY "Comments are viewable" ON public.comments FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users insert own comments" ON public.comments;
    CREATE POLICY "Users insert own comments" ON public.comments FOR INSERT WITH CHECK (
      (auth.role() = 'authenticated' AND user_id = auth.uid())
      OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
    );
    DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
    CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (
      (auth.role() = 'authenticated' AND user_id = auth.uid())
      OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
    ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Likes are viewable" ON public.likes;
    CREATE POLICY "Likes are viewable" ON public.likes FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users insert own likes" ON public.likes;
    CREATE POLICY "Users insert own likes" ON public.likes FOR INSERT WITH CHECK (
      (auth.role() = 'authenticated' AND user_id = auth.uid())
      OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
    );
    DROP POLICY IF EXISTS "Users delete own likes" ON public.likes;
    CREATE POLICY "Users delete own likes" ON public.likes FOR DELETE USING (
      (auth.role() = 'authenticated' AND user_id = auth.uid())
      OR (auth.role() = 'anon' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id))
    );
  END IF;
END $$;

-- 13. Ensure proper table grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.videos TO anon, authenticated, service_role;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    GRANT ALL ON TABLE public.comments TO anon, authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
    GRANT ALL ON TABLE public.likes TO anon, authenticated, service_role;
  END IF;
END $$;
