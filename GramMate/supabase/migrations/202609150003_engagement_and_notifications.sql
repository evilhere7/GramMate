-- Engagement evidence and user notifications for the economy.
-- Qualified activity is evidence for later scoring; it is not money.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.qualified_view_events (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  session_key text not null,
  watch_seconds integer not null check (watch_seconds >= 0),
  video_duration_seconds integer not null check (video_duration_seconds > 0),
  completion_percent numeric(6,2) not null check (completion_percent >= 0 and completion_percent <= 100),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  status text not null default 'pending' check (status in ('pending','qualified','rejected','review')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (viewer_id, video_id, session_key)
);

alter table public.creator_scores add column if not exists qualified_views integer not null default 0;
alter table public.creator_scores add column if not exists completions integer not null default 0;
alter table public.creator_scores add column if not exists meaningful_engagements integer not null default 0;
alter table public.creator_scores add column if not exists original_content_score numeric(12,4) not null default 0;
alter table public.creator_scores add column if not exists returning_viewers integer not null default 0;
alter table public.creator_scores add column if not exists fraud_adjustment numeric(12,4) not null default 0;

create index if not exists idx_qualified_views_creator_period
  on public.qualified_view_events(creator_id, created_at desc, status);
create index if not exists idx_qualified_views_viewer_created
  on public.qualified_view_events(viewer_id, created_at desc);
create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create or replace function public.record_qualified_view(
  target_viewer_id uuid,
  target_video_id uuid,
  target_creator_id uuid,
  target_watch_seconds integer,
  target_duration_seconds integer,
  target_session_key text,
  target_risk_score integer default 0
)
returns public.qualified_view_events as $$
declare
  result public.qualified_view_events;
  rules jsonb;
  minimum_seconds integer;
  minimum_percent numeric;
  maximum_risk integer;
  completion numeric;
begin
  if target_viewer_id is null then raise exception 'Authenticated viewer required'; end if;
  if target_creator_id = target_viewer_id then raise exception 'Self-views are not eligible'; end if;
  if target_duration_seconds <= 0 or target_watch_seconds < 0 then raise exception 'Invalid watch metrics'; end if;

  select value into rules from public.economy_settings where key = 'qualified_view_rules';
  minimum_seconds := coalesce((rules->>'minimum_watch_seconds')::integer, 10);
  minimum_percent := coalesce((rules->>'minimum_percent_watched')::numeric, 40);
  maximum_risk := coalesce((rules->>'max_risk_score')::integer, 40);
  completion := least(100, round((target_watch_seconds::numeric / target_duration_seconds::numeric) * 100, 2));

  insert into public.qualified_view_events(
    viewer_id, creator_id, video_id, session_key, watch_seconds,
    video_duration_seconds, completion_percent, risk_score, status
  ) values (
    target_viewer_id, target_creator_id, target_video_id, target_session_key,
    target_watch_seconds, target_duration_seconds, completion, target_risk_score,
    case when target_watch_seconds >= minimum_seconds
      and completion >= minimum_percent
      and target_risk_score <= maximum_risk then 'qualified' else 'review' end
  ) returning * into result;

  return result;
exception when unique_violation then
  raise exception 'Duplicate view session';
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.record_qualified_view(uuid, uuid, uuid, integer, integer, text, integer) from public, anon, authenticated;
grant execute on function public.record_qualified_view(uuid, uuid, uuid, integer, integer, text, integer) to service_role;

alter table public.notifications enable row level security;
alter table public.qualified_view_events enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own qualified views" on public.qualified_view_events;
create policy "Users read own qualified views" on public.qualified_view_events
  for select using (auth.uid() = viewer_id or auth.uid() = creator_id or public.is_admin());
