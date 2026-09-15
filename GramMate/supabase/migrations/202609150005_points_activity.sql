-- Server-controlled GramMate Points. Points are not cash and are capped by time windows.

create or replace function public.record_points_activity(
  target_user_id uuid,
  target_source text,
  target_reference_id uuid default null,
  target_idempotency_key text default null
)
returns public.point_ledger as $$
declare
  points_awarded integer;
  ledger_row public.point_ledger;
  daily_total integer;
  monthly_total integer;
  daily_limit integer;
  monthly_limit integer;
  rules jsonb;
begin
  if target_user_id is null then raise exception 'User required'; end if;
  points_awarded := case target_source
    when 'qualified_watch' then 5
    when 'meaningful_comment' then 10
    when 'follow_creator' then 3
    when 'qualified_referral' then 50
    when 'campaign_activity' then 10
    else 0
  end;
  if points_awarded = 0 then raise exception 'Unsupported points activity'; end if;

  if target_idempotency_key is null then
    raise exception 'Idempotency key required';
  end if;
  select * into ledger_row from public.point_ledger where idempotency_key = target_idempotency_key;
  if ledger_row.id is not null then return ledger_row; end if;

  select value into rules from public.economy_settings where key = 'viewer_reward_rules';
  daily_limit := coalesce((rules->>'daily_points_limit')::integer, 500);
  monthly_limit := coalesce((rules->>'monthly_points_limit')::integer, 5000);

  select coalesce(sum(amount), 0) into daily_total from public.point_ledger
  where user_id = target_user_id and amount > 0
    and created_at >= date_trunc('day', timezone('utc'::text, now()));
  select coalesce(sum(amount), 0) into monthly_total from public.point_ledger
  where user_id = target_user_id and amount > 0
    and created_at >= date_trunc('month', timezone('utc'::text, now()));

  if daily_total + points_awarded > daily_limit or monthly_total + points_awarded > monthly_limit then
    raise exception 'Points limit reached';
  end if;

  insert into public.point_ledger(user_id, amount, source, reference_id, idempotency_key)
  values (target_user_id, points_awarded, target_source, target_reference_id, target_idempotency_key)
  returning * into ledger_row;

  insert into public.point_balances(user_id, balance, lifetime_earned)
  values (target_user_id, points_awarded, points_awarded)
  on conflict (user_id) do update set
    balance = public.point_balances.balance + points_awarded,
    lifetime_earned = public.point_balances.lifetime_earned + points_awarded,
    updated_at = timezone('utc'::text, now());

  return ledger_row;
end;
$$ language plpgsql security definer set search_path = public;
