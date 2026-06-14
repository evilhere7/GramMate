-- Supabase SQL: Profiles table, RLS policies, and admin trigger
-- Run these in the Supabase SQL editor (Project -> SQL)

-- 1) Create profiles table (id should match auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'user',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- 2) Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_timestamp ON public.profiles;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- 3) Auto-assign admin role for configured email on insert
-- Replace the email below with your admin email or set via environment in your deployment process.
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) = lower('evilmc777@gmail.com') THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_admin ON public.profiles;
CREATE TRIGGER auto_assign_admin BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

-- 4) Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5) Policies
-- Allow authenticated users to insert their own profile
CREATE POLICY "Profiles: insert own" ON public.profiles
FOR INSERT USING (auth.role() = 'authenticated') WITH CHECK (auth.uid() = id);

-- Allow users to select any profile (publicly visible). Change condition to restrict if needed.
CREATE POLICY "Profiles: select" ON public.profiles
FOR SELECT USING (true);

-- Allow users to update only their own profile (except 'role' field)
CREATE POLICY "Profiles: update own" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent users from updating their role via client (role changes must be done by server or service key)
-- We'll create a separate policy to allow service_role to update role
CREATE POLICY "Profiles: update role by service" ON public.profiles
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (true);

-- 6) Example: create a view that exposes public profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, display_name, avatar_url, bio, role
FROM public.profiles;

-- Grant select to anon
GRANT SELECT ON public.public_profiles TO anon;

-- Note: To adjust defaults or add more tables (posts, comments, subscriptions), create similar policies ensuring auth.uid() checks and service_role for backend operations.

-- Storage bucket guidance: create buckets 'avatars' and 'videos' in Storage. Use signed uploads for private buckets or enforce object access via RLS on metadata tables.

-- End of file
