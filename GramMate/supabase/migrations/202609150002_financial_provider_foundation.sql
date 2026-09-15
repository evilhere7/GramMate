-- GramMate financial provider foundation.
-- Provider-confirmed records only; all monetization flags remain disabled by default.

alter table public.platform_revenue add column if not exists provider text;
alter table public.platform_revenue add column if not exists provider_transaction_id text;
alter table public.platform_revenue add column if not exists provider_fee_cents integer not null default 0;
alter table public.platform_revenue add column if not exists tax_amount_cents integer not null default 0;
alter table public.platform_revenue add column if not exists refund_amount_cents integer not null default 0;

create unique index if not exists idx_platform_revenue_provider_tx
  on public.platform_revenue(provider, provider_transaction_id)
  where provider is not null and provider_transaction_id is not null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  payload_hash text,
  processed boolean not null default false,
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, event_id)
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  billing_interval text not null check (billing_interval in ('month','year','one_time')),
  provider text,
  provider_price_id text,
  active boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_price_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text not null,
  status text not null check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_subscription_id)
);

create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null,
  provider_account_id text not null,
  status text not null default 'pending',
  onboarding_complete boolean not null default false,
  payouts_enabled boolean not null default false,
  charges_enabled boolean not null default false,
  country text,
  currency text,
  requirements_due jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_account_id),
  unique (user_id, provider)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete restrict not null,
  payout_account_id uuid references public.payout_accounts(id) on delete restrict not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  provider text not null,
  provider_payout_id text,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','canceled','reversed','requires_action')),
  failure_code text,
  failure_message text,
  idempotency_key text not null unique,
  requested_at timestamptz not null default timezone('utc'::text, now()),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_payout_id)
);

create table if not exists public.point_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount <> 0),
  source text not null,
  reference_id uuid,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.ad_revenue (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  period_start date not null,
  period_end date not null,
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  fees_cents integer not null default 0 check (fees_cents >= 0),
  adjustments_cents integer not null default 0,
  net_amount_cents integer generated always as (gross_amount_cents - fees_cents + adjustments_cents) stored,
  currency text not null default 'USD',
  provider_reference text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','refunded','reversed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_reference)
);

create table if not exists public.payment_provider_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.financial_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_payment_webhook_events_processed on public.payment_webhook_events(processed, created_at);
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status);
create index if not exists idx_payouts_user_status on public.payouts(user_id, status, created_at desc);
create index if not exists idx_ad_revenue_period on public.ad_revenue(period_start, period_end, status);
create index if not exists idx_financial_audit_entity on public.financial_audit_logs(entity_type, entity_id, created_at desc);

alter table public.payment_webhook_events enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.payouts enable row level security;
alter table public.point_balances enable row level security;
alter table public.point_ledger enable row level security;
alter table public.ad_revenue enable row level security;
alter table public.payment_provider_settings enable row level security;
alter table public.financial_audit_logs enable row level security;

drop policy if exists "Payment webhook events admin read" on public.payment_webhook_events;
create policy "Payment webhook events admin read" on public.payment_webhook_events
  for select using (public.is_admin());

drop policy if exists "Active subscription plans public read" on public.subscription_plans;
create policy "Active subscription plans public read" on public.subscription_plans
  for select using (active = true or public.is_admin());

drop policy if exists "Subscriptions own read" on public.subscriptions;
create policy "Subscriptions own read" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Payout accounts own read" on public.payout_accounts;
create policy "Payout accounts own read" on public.payout_accounts
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Payouts own read" on public.payouts;
create policy "Payouts own read" on public.payouts
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Point balances own read" on public.point_balances;
create policy "Point balances own read" on public.point_balances
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Point ledger own read" on public.point_ledger;
create policy "Point ledger own read" on public.point_ledger
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Ad revenue admin only" on public.ad_revenue;
create policy "Ad revenue admin only" on public.ad_revenue
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Provider settings public read" on public.payment_provider_settings;
create policy "Provider settings public read" on public.payment_provider_settings
  for select using (is_public = true or public.is_admin());

drop policy if exists "Provider settings admin manage" on public.payment_provider_settings;
create policy "Provider settings admin manage" on public.payment_provider_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Financial audit admin read" on public.financial_audit_logs;
create policy "Financial audit admin read" on public.financial_audit_logs
  for select using (public.is_admin());

insert into public.payment_provider_settings(key, value, is_public)
values
  ('active_payment_provider', '"stripe"'::jsonb, false),
  ('active_payout_provider', '"stripe_connect"'::jsonb, false),
  ('payments_mode', '"development"'::jsonb, false),
  ('supported_countries', '[]'::jsonb, true),
  ('supported_currencies', '["USD"]'::jsonb, true),
  ('payout_schedule', '"monthly"'::jsonb, true),
  ('automatic_payouts_enabled', 'false'::jsonb, true)
on conflict (key) do nothing;
