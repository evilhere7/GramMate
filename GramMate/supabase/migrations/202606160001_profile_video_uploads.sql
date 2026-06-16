create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'video_publish_status') then
    create type public.video_publish_status as enum ('draft', 'published');
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos', 'videos', true, 5368709120, array['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/ogg']),
  ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists role text not null default 'viewer';
alter table public.profiles add column if not exists followers_count integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.profiles set user_id = id where user_id is null;
update public.profiles set banner_url = cover_url where banner_url is null and cover_url is not null;
update public.profiles set display_name = full_name where display_name is null and full_name is not null;

alter table public.profiles alter column user_id set not null;
alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length check (bio is null or char_length(bio) <= 160) not valid;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$') not valid;

create unique index if not exists profiles_user_id_unique on public.profiles(user_id);
create unique index if not exists profiles_username_unique on public.profiles(lower(username)) where username is not null;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.videos add column if not exists creator_id uuid;
alter table public.videos add column if not exists user_id uuid;
alter table public.videos add column if not exists title text;
alter table public.videos add column if not exists description text;
alter table public.videos add column if not exists video_url text;
alter table public.videos add column if not exists thumbnail_url text;
alter table public.videos add column if not exists status public.video_publish_status not null default 'draft';
alter table public.videos add column if not exists visibility text not null default 'private';
alter table public.videos add column if not exists processing_status text not null default 'ready';
alter table public.videos add column if not exists moderation_status text not null default 'approved';
alter table public.videos add column if not exists is_active boolean not null default true;
alter table public.videos add column if not exists likes_count integer not null default 0;
alter table public.videos add column if not exists comments_count integer not null default 0;
alter table public.videos add column if not exists shares_count integer not null default 0;
alter table public.videos add column if not exists saves_count integer not null default 0;
alter table public.videos add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.videos set creator_id = user_id where creator_id is null and user_id is not null;
update public.videos set user_id = creator_id where user_id is null and creator_id is not null;
update public.videos set status = 'published' where status = 'draft' and visibility = 'public';

alter table public.videos
  drop constraint if exists videos_creator_id_fkey,
  add constraint videos_creator_id_fkey foreign key (creator_id) references public.profiles(id) on delete cascade;

alter table public.videos
  drop constraint if exists videos_user_id_fkey,
  add constraint videos_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.videos drop constraint if exists videos_title_length;
alter table public.videos add constraint videos_title_length check (title is null or char_length(title) between 1 and 120) not valid;

create index if not exists idx_videos_creator_id on public.videos(creator_id);
create index if not exists idx_videos_published_feed on public.videos(status, created_at desc) where status = 'published';

alter table public.profiles enable row level security;
alter table public.videos enable row level security;

drop policy if exists "Public profiles are viewable" on public.profiles;
drop policy if exists "Profiles are readable" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Profiles are readable"
on public.profiles for select
using (true);

create policy "Users insert own profile"
on public.profiles for insert
with check (auth.uid() = id or auth.uid() = user_id);

create policy "Users update own profile"
on public.profiles for update
using (auth.uid() = id or auth.uid() = user_id)
with check (auth.uid() = id or auth.uid() = user_id);

drop policy if exists "Approved public videos are viewable" on public.videos;
drop policy if exists "Published videos are readable by authenticated users" on public.videos;
drop policy if exists "Creators insert own videos" on public.videos;
drop policy if exists "Creators update own videos" on public.videos;

create policy "Published videos are readable by authenticated users"
on public.videos for select
to authenticated
using (
  status = 'published'
  or auth.uid() = creator_id
  or auth.uid() = user_id
);

create policy "Creators insert own videos"
on public.videos for insert
to authenticated
with check (auth.uid() = creator_id and auth.uid() = user_id);

create policy "Creators update own videos"
on public.videos for update
to authenticated
using (auth.uid() = creator_id or auth.uid() = user_id)
with check (auth.uid() = creator_id or auth.uid() = user_id);

drop policy if exists "Videos are publicly readable" on storage.objects;
drop policy if exists "Creators upload own videos" on storage.objects;
drop policy if exists "Creators update own videos" on storage.objects;
drop policy if exists "Profile images are publicly readable" on storage.objects;
drop policy if exists "Users upload own profile images" on storage.objects;
drop policy if exists "Users update own profile images" on storage.objects;

create policy "Videos are publicly readable"
on storage.objects for select
using (bucket_id = 'videos');

create policy "Creators upload own videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Creators update own videos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Profile images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users upload own profile images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    ((storage.foldername(name))[1] = 'banners' and (storage.foldername(name))[2] = auth.uid()::text)
    or ((storage.foldername(name))[1] = 'public' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);

create policy "Users update own profile images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    ((storage.foldername(name))[1] = 'banners' and (storage.foldername(name))[2] = auth.uid()::text)
    or ((storage.foldername(name))[1] = 'public' and (storage.foldername(name))[2] = auth.uid()::text)
  )
)
with check (
  bucket_id = 'avatars'
  and (
    ((storage.foldername(name))[1] = 'banners' and (storage.foldername(name))[2] = auth.uid()::text)
    or ((storage.foldername(name))[1] = 'public' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);
