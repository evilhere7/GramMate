-- GramMate Complete Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table (Extends Supabase Auth Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Videos Table
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reward_rate_per_min DECIMAL(10,4) DEFAULT 0.0100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Wallets Table
CREATE TABLE public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance_cents INTEGER DEFAULT 0,
  pending_cents INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to create a wallet automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_wallet();

-- 4. Transactions Table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earning', 'withdrawal', 'tip')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id UUID, -- could reference a video or tip
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Engagements (Likes/Comments)
CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, video_id)
);

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_likes_video_id ON public.likes(video_id);
CREATE INDEX idx_comments_video_id ON public.comments(video_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, but users can only update their own
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Videos: Anyone can read active videos, users manage their own
CREATE POLICY "Active videos are viewable by everyone." 
ON public.videos FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own videos." 
ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos." 
ON public.videos FOR UPDATE USING (auth.uid() = user_id);

-- Wallets: Users can only see and update their own wallet
CREATE POLICY "Users can view own wallet." 
ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet." 
ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
