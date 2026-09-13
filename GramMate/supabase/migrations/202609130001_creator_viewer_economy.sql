-- GramMate creator + viewer economy architecture
-- Additive migration: revenue-backed pools, auditable wallet ledger, withdrawals,
-- scoring snapshots, feature flags, and admin audit trails.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists email text;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.admins a
    join public.profiles p on lower(p.email) = lower(a.email)
    where p.id = auth.uid()
  ) or exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$ language sql security definer;

create table if not exists public.economy_settings (
  key text primary key,
  value jsonb not null,
  value_type text not null default 'json',
  is_public boolean not null default false,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.economy_setting_history (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null,
  old_value jsonb,
  new_value jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  balance_cents integer not null default 0,
  pending_cents integer not null default 0,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  amount_cents integer not null,
  transaction_type text not null,
  status text not null default 'completed',
  description text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.economy_settings (key, value, value_type, is_public, description)
values
  ('feature_flags', '{
    "creator_revenue_sharing_enabled": false,
    "viewer_rewards_enabled": false,
    "tips_enabled": false,
    "creator_subscriptions_enabled": false,
    "referrals_enabled": false,
    "marketplace_enabled": false,
    "advertising_enabled": false,
    "withdrawals_enabled": false
  }'::jsonb, 'json', true, 'Launch gates for revenue and payout features. Disabled until real providers are configured.'),
  ('pool_allocations', '{"creator_pool_percent":70,"viewer_reward_pool_percent":10,"platform_reserve_percent":20}'::jsonb, 'json', true, 'Monthly net distributable revenue split. Percentages must total 100.'),
  ('creator_score_weights', '{"qualified_watch_time":50,"viewer_retention":20,"meaningful_engagement":15,"returning_viewers":10,"shares_saves":5}'::jsonb, 'json', true, 'Creator score weights used for pool allocation.'),
  ('qualified_view_rules', '{"minimum_watch_seconds":10,"minimum_percent_watched":40,"max_risk_score":40,"same_viewer_cooldown_hours":6}'::jsonb, 'json', true, 'Thresholds for qualified views and watch sessions.'),
  ('viewer_reward_rules', '{"daily_points_limit":500,"monthly_points_limit":5000,"point_to_currency_rate":0.0001,"minimum_redemption_cents":500,"cooldown_seconds":60}'::jsonb, 'json', true, 'Viewer points, estimates, and redemption controls. Points are not cash.'),
  ('creator_eligibility_rules', '{"minimum_account_age_days":30,"minimum_followers":100,"minimum_qualified_watch_seconds":36000,"requires_verified_email":true,"requires_good_standing":true}'::jsonb, 'json', true, 'Creator monetization eligibility requirements.'),
  ('fees', '{"tip_platform_fee_percent":20,"subscription_platform_fee_percent":20,"marketplace_platform_fee_percent":15}'::jsonb, 'json', true, 'Configurable platform fee examples for future integrations.'),
  ('fraud_thresholds', '{"review_risk_score":50,"restrict_risk_score":75,"block_risk_score":90,"withdrawal_review_cents":10000}'::jsonb, 'json', false, 'Risk thresholds for admin review and payout holds.'),
  ('payment_provider_status', '{"stripe":"not_configured","paypal":"not_configured","esewa":"not_configured","khalti":"not_configured","bank_transfer":"not_configured","advertising_provider":"not_configured"}'::jsonb, 'json', true, 'External provider readiness. Architecture only until credentials and webhooks exist.')
on conflict (key) do nothing;

alter table public.wallets add column if not exists available_cents integer not null default 0;
alter table public.wallets add column if not exists pending_cents integer not null default 0;
alter table public.wallets add column if not exists lifetime_earned_cents integer not null default 0;
alter table public.wallets add column if not exists lifetime_withdrawn_cents integer not null default 0;
alter table public.wallets add column if not exists lifetime_rewards_cents integer not null default 0;
alter table public.wallets add column if not exists points_balance integer not null default 0;
alter table public.wallets add column if not exists points_lifetime_earned integer not null default 0;
alter table public.wallets add column if not exists risk_hold_cents integer not null default 0;
alter table public.wallets add column if not exists payout_status text not null default 'not_configured';

update public.wallets
set available_cents = greatest(available_cents, coalesce(balance_cents, 0))
where available_cents = 0 and coalesce(balance_cents, 0) <> 0;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  direction text not null check (direction in ('credit', 'debit')),
  amount_cents integer not null default 0,
  points integer not null default 0,
  currency text not null default 'USD',
  transaction_type text not null check (transaction_type in (
    'creator_revenue','viewer_reward','points_reward','tip_received','tip_sent',
    'subscription_revenue','platform_fee','withdrawal','withdrawal_reversal',
    'refund','adjustment','bonus','referral_reward','marketplace_fee'
  )),
  balance_bucket text not null default 'pending' check (balance_bucket in ('pending','available','points','hold')),
  status text not null default 'pending' check (status in ('pending','available','completed','review','failed','reversed','cancelled')),
  source_table text,
  source_id uuid,
  idempotency_key text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.platform_revenue (
  id uuid primary key default gen_random_uuid(),
  revenue_type text not null check (revenue_type in ('advertising','premium_subscription','creator_subscription','tip','marketplace','business_campaign','sponsored_content','premium_service','other')),
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  fees_cents integer not null default 0 check (fees_cents >= 0),
  net_amount_cents integer generated always as (gross_amount_cents - fees_cents) stored,
  currency text not null default 'USD',
  source_reference text,
  status text not null default 'pending' check (status in ('pending','confirmed','refunded','reversed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.economy_settlements (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  calculation_version text not null default 'v1',
  gross_revenue_cents integer not null default 0,
  fees_cents integer not null default 0,
  net_distributable_cents integer not null default 0,
  allocation_snapshot jsonb not null,
  score_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','calculating','review','completed','cancelled')),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (period_start, period_end, calculation_version)
);

create table if not exists public.revenue_pools (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid references public.economy_settlements(id) on delete cascade,
  pool_type text not null check (pool_type in ('creator_pool','viewer_reward_pool','platform_reserve')),
  allocation_percent numeric(5,2) not null check (allocation_percent >= 0 and allocation_percent <= 100),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  settings_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','allocated','distributed','cancelled')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.creator_scores (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  settlement_id uuid references public.economy_settlements(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  qualified_watch_seconds integer not null default 0,
  retention_score numeric(12,4) not null default 0,
  engagement_score numeric(12,4) not null default 0,
  returning_viewer_score numeric(12,4) not null default 0,
  shares_saves_score numeric(12,4) not null default 0,
  total_score numeric(18,6) not null default 0,
  formula_snapshot jsonb not null default '{}'::jsonb,
  fraud_status text not null default 'normal' check (fraud_status in ('normal','review','restricted','blocked')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (creator_id, period_start, period_end)
);

create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  settlement_id uuid references public.economy_settlements(id) on delete cascade,
  wallet_transaction_id uuid references public.wallet_transactions(id) on delete set null,
  period_start date not null,
  period_end date not null,
  source_type text not null default 'revenue_share',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','available','paid','review','reversed','cancelled')),
  score numeric(18,6) not null default 0,
  pool_share_percent numeric(9,6) not null default 0,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  source_table text,
  source_id uuid,
  points integer not null default 0 check (points >= 0),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  status text not null default 'pending' check (status in ('pending','qualified','rejected','review','cancelled')),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.viewer_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  settlement_id uuid references public.economy_settlements(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  reward_score numeric(18,6) not null default 0,
  qualified_events_count integer not null default 0,
  points_earned integer not null default 0,
  formula_snapshot jsonb not null default '{}'::jsonb,
  fraud_status text not null default 'normal' check (fraud_status in ('normal','review','restricted','blocked')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, period_start, period_end)
);

create table if not exists public.viewer_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  settlement_id uuid references public.economy_settlements(id) on delete cascade,
  wallet_transaction_id uuid references public.wallet_transactions(id) on delete set null,
  period_start date not null,
  period_end date not null,
  points integer not null default 0 check (points >= 0),
  estimated_amount_cents integer not null default 0 check (estimated_amount_cents >= 0),
  confirmed_amount_cents integer not null default 0 check (confirmed_amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'estimated' check (status in ('estimated','pending','available','redeemed','review','reversed','cancelled')),
  calculation_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  payout_method text not null,
  payout_destination_label text,
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected','paid','cancelled','failed')),
  provider_reference text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  paid_at timestamptz,
  unique (idempotency_key)
);

create table if not exists public.fraud_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  related_user_id uuid references public.profiles(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  event_type text not null,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  fraud_status text not null default 'normal' check (fraud_status in ('normal','review','restricted','blocked')),
  signals jsonb not null default '{}'::jsonb,
  action_taken text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz
);

create table if not exists public.creator_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'planned' check (status in ('planned','pending','active','disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.creator_subscription_plans(id) on delete set null,
  subscriber_id uuid references public.profiles(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'pending_payment' check (status in ('pending_payment','active','past_due','cancelled','expired')),
  provider_reference text,
  started_at timestamptz,
  renews_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  creator_amount_cents integer not null check (creator_amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','refunded','reversed','cancelled')),
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  status text not null default 'planned' check (status in ('planned','pending','active','disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.advertising_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.advertisers(id) on delete set null,
  name text not null,
  budget_cents integer not null default 0 check (budget_cents >= 0),
  spent_cents integer not null default 0 check (spent_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'planned' check (status in ('planned','pending','active','paused','completed','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.advertising_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.advertising_campaigns(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  event_type text not null check (event_type in ('impression','click','conversion','billable_impression','billable_click')),
  revenue_cents integer not null default 0 check (revenue_cents >= 0),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.sponsored_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  creator_id uuid references public.profiles(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  budget_cents integer not null default 0 check (budget_cents >= 0),
  creator_amount_cents integer not null default 0 check (creator_amount_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  currency text not null default 'USD',
  deliverables jsonb not null default '[]'::jsonb,
  status text not null default 'planned' check (status in ('planned','creator_applied','creator_selected','pending_payment','active','completed','cancelled')),
  payment_revenue_id uuid references public.platform_revenue(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending','qualified','rewarded','rejected','review')),
  reward_points integer not null default 0 check (reward_points >= 0),
  reward_cents integer not null default 0 check (reward_cents >= 0),
  qualified_at timestamptz,
  fraud_status text not null default 'normal' check (fraud_status in ('normal','review','restricted','blocked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (referrer_id, referred_user_id),
  check (referrer_id <> referred_user_id)
);

create table if not exists public.marketplace_transactions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete set null,
  product_id uuid,
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  seller_amount_cents integer not null default 0 check (seller_amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'planned' check (status in ('planned','pending_payment','confirmed','fulfilled','refunded','cancelled')),
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (idempotency_key)
);

create table if not exists public.admin_economy_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.validate_pool_allocation()
returns trigger as $$
declare
  allocations jsonb;
  creator numeric;
  viewer numeric;
  reserve numeric;
begin
  if new.key <> 'pool_allocations' then
    return new;
  end if;

  allocations := new.value;
  creator := coalesce((allocations->>'creator_pool_percent')::numeric, 0);
  viewer := coalesce((allocations->>'viewer_reward_pool_percent')::numeric, 0);
  reserve := coalesce((allocations->>'platform_reserve_percent')::numeric, 0);

  if creator < 0 or viewer < 0 or reserve < 0 or creator > 100 or viewer > 100 or reserve > 100 then
    raise exception 'Pool allocation percentages must be between 0 and 100';
  end if;

  if round(creator + viewer + reserve, 2) <> 100 then
    raise exception 'Pool allocation percentages must equal 100';
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function public.log_economy_setting_change()
returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.value is distinct from new.value then
    insert into public.economy_setting_history(setting_key, old_value, new_value, changed_by)
    values (new.key, old.value, new.value, new.updated_by);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists validate_pool_allocation_before_change on public.economy_settings;
create trigger validate_pool_allocation_before_change
  before insert or update on public.economy_settings
  for each row execute function public.validate_pool_allocation();

drop trigger if exists log_economy_setting_change_after_update on public.economy_settings;
create trigger log_economy_setting_change_after_update
  after update on public.economy_settings
  for each row execute function public.log_economy_setting_change();

create or replace function public.request_wallet_withdrawal(
  request_amount_cents integer,
  request_payout_method text,
  request_destination_label text default null,
  request_idempotency_key text default null
)
returns public.withdrawal_requests as $$
declare
  wallet_row public.wallets;
  flags jsonb;
  minimum_cents integer;
  withdrawal_row public.withdrawal_requests;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select value into flags from public.economy_settings where key = 'feature_flags';
  if coalesce((flags->>'withdrawals_enabled')::boolean, false) is false then
    raise exception 'Withdrawals are not available yet';
  end if;

  minimum_cents := coalesce((
    select (value->>'minimum_redemption_cents')::integer
    from public.economy_settings
    where key = 'viewer_reward_rules'
  ), 500);

  if request_amount_cents < minimum_cents then
    raise exception 'Requested amount is below the minimum withdrawal';
  end if;

  select * into wallet_row
  from public.wallets
  where user_id = auth.uid()
  for update;

  if wallet_row.id is null then
    insert into public.wallets(user_id) values (auth.uid()) returning * into wallet_row;
  end if;

  if wallet_row.available_cents < request_amount_cents then
    raise exception 'Insufficient available balance';
  end if;

  insert into public.withdrawal_requests(
    wallet_id,
    user_id,
    amount_cents,
    payout_method,
    payout_destination_label,
    status,
    idempotency_key
  )
  values (
    wallet_row.id,
    auth.uid(),
    request_amount_cents,
    request_payout_method,
    request_destination_label,
    'pending_review',
    coalesce(request_idempotency_key, 'withdrawal:' || auth.uid() || ':' || gen_random_uuid())
  )
  returning * into withdrawal_row;

  insert into public.wallet_transactions(
    wallet_id,
    user_id,
    direction,
    amount_cents,
    transaction_type,
    balance_bucket,
    status,
    source_table,
    source_id,
    idempotency_key,
    description
  )
  values (
    wallet_row.id,
    auth.uid(),
    'debit',
    request_amount_cents,
    'withdrawal',
    'hold',
    'review',
    'withdrawal_requests',
    withdrawal_row.id,
    'withdrawal-hold:' || withdrawal_row.id,
    'Withdrawal request pending review'
  );

  update public.wallets
  set available_cents = available_cents - request_amount_cents,
      risk_hold_cents = risk_hold_cents + request_amount_cents,
      updated_at = timezone('utc'::text, now())
  where id = wallet_row.id;

  return withdrawal_row;
end;
$$ language plpgsql security definer;

create index if not exists idx_wallet_transactions_user_created on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_wallet_transactions_status on public.wallet_transactions(status, transaction_type);
create index if not exists idx_platform_revenue_status_type on public.platform_revenue(status, revenue_type);
create index if not exists idx_creator_scores_creator_period on public.creator_scores(creator_id, period_start, period_end);
create index if not exists idx_viewer_scores_user_period on public.viewer_scores(user_id, period_start, period_end);
create index if not exists idx_withdrawal_requests_status on public.withdrawal_requests(status, created_at desc);
create index if not exists idx_fraud_events_status_score on public.fraud_events(fraud_status, risk_score desc);

alter table public.economy_settings enable row level security;
alter table public.economy_setting_history enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.platform_revenue enable row level security;
alter table public.economy_settlements enable row level security;
alter table public.revenue_pools enable row level security;
alter table public.creator_scores enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.reward_events enable row level security;
alter table public.viewer_scores enable row level security;
alter table public.viewer_rewards enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.fraud_events enable row level security;
alter table public.creator_subscription_plans enable row level security;
alter table public.creator_subscriptions enable row level security;
alter table public.tips enable row level security;
alter table public.advertisers enable row level security;
alter table public.advertising_campaigns enable row level security;
alter table public.advertising_events enable row level security;
alter table public.sponsored_campaigns enable row level security;
alter table public.referrals enable row level security;
alter table public.marketplace_transactions enable row level security;
alter table public.admin_economy_actions enable row level security;

drop policy if exists "Economy settings public read" on public.economy_settings;
create policy "Economy settings public read" on public.economy_settings
  for select using (is_public = true or public.is_admin());

drop policy if exists "Economy settings admin manage" on public.economy_settings;
create policy "Economy settings admin manage" on public.economy_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Economy history admin read" on public.economy_setting_history;
create policy "Economy history admin read" on public.economy_setting_history
  for select using (public.is_admin());

drop policy if exists "Wallets are readable" on public.wallets;
drop policy if exists "Allow wallet update" on public.wallets;
drop policy if exists "Users view own wallet" on public.wallets;
drop policy if exists "Wallet own read" on public.wallets;
create policy "Wallet own read" on public.wallets
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Wallet admin manage" on public.wallets;
create policy "Wallet admin manage" on public.wallets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Transactions are readable" on public.transactions;
drop policy if exists "Allow transaction insert" on public.transactions;
drop policy if exists "Users view own transactions" on public.transactions;
drop policy if exists "Legacy transactions own read" on public.transactions;
create policy "Legacy transactions own read" on public.transactions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Wallet transactions own read" on public.wallet_transactions;
create policy "Wallet transactions own read" on public.wallet_transactions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Wallet transactions admin insert" on public.wallet_transactions;
create policy "Wallet transactions admin insert" on public.wallet_transactions
  for insert with check (public.is_admin());

drop policy if exists "Platform revenue admin only" on public.platform_revenue;
create policy "Platform revenue admin only" on public.platform_revenue
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Settlements admin only" on public.economy_settlements;
create policy "Settlements admin only" on public.economy_settlements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Revenue pools admin only" on public.revenue_pools;
create policy "Revenue pools admin only" on public.revenue_pools
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Creator scores own read" on public.creator_scores;
create policy "Creator scores own read" on public.creator_scores
  for select using (auth.uid() = creator_id or public.is_admin());

drop policy if exists "Creator earnings own read" on public.creator_earnings;
create policy "Creator earnings own read" on public.creator_earnings
  for select using (auth.uid() = creator_id or public.is_admin());

drop policy if exists "Reward events own read" on public.reward_events;
create policy "Reward events own read" on public.reward_events
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Viewer scores own read" on public.viewer_scores;
create policy "Viewer scores own read" on public.viewer_scores
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Viewer rewards own read" on public.viewer_rewards;
create policy "Viewer rewards own read" on public.viewer_rewards
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Withdrawal own read" on public.withdrawal_requests;
create policy "Withdrawal own read" on public.withdrawal_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Withdrawal admin manage" on public.withdrawal_requests;
create policy "Withdrawal admin manage" on public.withdrawal_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Fraud admin read" on public.fraud_events;
create policy "Fraud admin read" on public.fraud_events
  for select using (public.is_admin());

drop policy if exists "Creator plans public active read" on public.creator_subscription_plans;
create policy "Creator plans public active read" on public.creator_subscription_plans
  for select using (status = 'active' or auth.uid() = creator_id or public.is_admin());

drop policy if exists "Creator subscriptions scoped read" on public.creator_subscriptions;
create policy "Creator subscriptions scoped read" on public.creator_subscriptions
  for select using (auth.uid() = subscriber_id or auth.uid() = creator_id or public.is_admin());

drop policy if exists "Tips scoped read" on public.tips;
create policy "Tips scoped read" on public.tips
  for select using (auth.uid() = sender_id or auth.uid() = creator_id or public.is_admin());

drop policy if exists "Advertising admin only" on public.advertisers;
create policy "Advertising admin only" on public.advertisers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Advertising campaigns admin only" on public.advertising_campaigns;
create policy "Advertising campaigns admin only" on public.advertising_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Advertising events admin only" on public.advertising_events;
create policy "Advertising events admin only" on public.advertising_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Sponsored campaigns scoped read" on public.sponsored_campaigns;
create policy "Sponsored campaigns scoped read" on public.sponsored_campaigns
  for select using (auth.uid() = creator_id or public.is_admin());

drop policy if exists "Referrals scoped read" on public.referrals;
create policy "Referrals scoped read" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id or public.is_admin());

drop policy if exists "Marketplace scoped read" on public.marketplace_transactions;
create policy "Marketplace scoped read" on public.marketplace_transactions
  for select using (auth.uid() = seller_id or auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Admin economy actions admin only" on public.admin_economy_actions;
create policy "Admin economy actions admin only" on public.admin_economy_actions
  for all using (public.is_admin()) with check (public.is_admin());
