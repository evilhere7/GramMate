-- Keep the deployed video schema aligned with the feed and upload services.
-- This is additive and safe to run against existing videos.

alter table public.videos add column if not exists category text default 'General';
alter table public.videos add column if not exists tags text[] default '{}';
alter table public.videos add column if not exists duration_seconds integer;

create index if not exists idx_videos_category_created
  on public.videos(category, created_at desc);