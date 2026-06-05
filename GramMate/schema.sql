-- GramMate production-ready Supabase schema
-- Run in Supabase SQL Editor after enabling pgcrypto.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.app_role AS ENUM ('viewer', 'creator', 'admin', 'moderator');
CREATE TYPE public.video_visibility AS ENUM ('public', 'unlisted', 'scheduled', 'private');
CREATE TYPE public.processing_status AS ENUM ('queued', 'processing', 'ready', 'failed');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'limited', 'removed', 'appealed');
CREATE TYPE public.transaction_type AS ENUM ('watch_reward', 'engagement_reward', 'campaign_reward', 'ad_share', 'tip', 'donation', 'sponsorship', 'withdrawal', 'adjustment');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'cleared', 'review', 'failed', 'reversed');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  full_name TEXT,
  role public.app_role DEFAULT 'viewer' NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 240),
  public_url TEXT UNIQUE,
  social_links JSONB DEFAULT '{}'::jsonb NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  following_count INTEGER DEFAULT 0 NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  creator_badge TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_hash TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, device_fingerprint)
);

CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  auto_thumbnail_urls TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'General' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER,
  visibility public.video_visibility DEFAULT 'public' NOT NULL,
  processing_status public.processing_status DEFAULT 'queued' NOT NULL,
  moderation_status public.moderation_status DEFAULT 'pending' NOT NULL,
  scheduled_at TIMESTAMPTZ,
  reward_rate_per_min DECIMAL(10,4) DEFAULT 0.0100 NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  qualified_views_count INTEGER DEFAULT 0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  shares_count INTEGER DEFAULT 0 NOT NULL,
  saves_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.user_devices(id) ON DELETE SET NULL,
  watch_seconds INTEGER DEFAULT 0 NOT NULL,
  is_qualified BOOLEAN DEFAULT false NOT NULL,
  risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  traffic_source TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY(user_id, video_id)
);

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  moderation_status public.moderation_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.saved_videos (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY(user_id, video_id)
);

CREATE TABLE public.blocks (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance_cents INTEGER DEFAULT 0 NOT NULL,
  pending_cents INTEGER DEFAULT 0 NOT NULL,
  risk_hold_cents INTEGER DEFAULT 0 NOT NULL,
  stripe_account_id TEXT,
  kyc_status TEXT DEFAULT 'not_started' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  status public.transaction_status DEFAULT 'pending' NOT NULL,
  reference_id UUID,
  risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status public.transaction_status DEFAULT 'review' NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status public.report_status DEFAULT 'open' NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.risk_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  risk_level public.risk_level DEFAULT 'low' NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL CHECK (score BETWEEN 0 AND 100),
  signals JSONB DEFAULT '{}'::jsonb NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  priority public.risk_level DEFAULT 'low' NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_username TEXT;
BEGIN
  desired_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  INSERT INTO public.profiles (id, username, full_name, role, public_url, email_verified_at)
  VALUES (
    new.id,
    desired_username,
    coalesce(new.raw_user_meta_data->>'full_name', desired_username),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'viewer'),
    'grammate.com/@' || desired_username,
    new.email_confirmed_at
  );
  INSERT INTO public.wallets (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_feed ON public.videos(visibility, processing_status, moderation_status, created_at DESC);
CREATE INDEX idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX idx_comments_video_id ON public.comments(video_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_risk_events_score ON public.risk_events(score DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users manage own devices" ON public.user_devices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Approved public videos are viewable" ON public.videos FOR SELECT USING (
  is_active = true AND visibility = 'public' AND processing_status = 'ready' AND moderation_status = 'approved'
  OR auth.uid() = user_id
  OR public.is_admin()
);
CREATE POLICY "Creators insert own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create own engagement" ON public.likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users create own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Approved comments are viewable" ON public.comments FOR SELECT USING (moderation_status = 'approved' OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users save own videos" ON public.saved_videos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own blocks" ON public.blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins manage reports" ON public.reports FOR ALL USING (public.is_admin());
CREATE POLICY "Admins view risk events" ON public.risk_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Users manage support tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
