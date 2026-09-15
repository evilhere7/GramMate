-- Atomic server-side wallet operations. Clients receive no write policy for these tables.

create or replace function public.record_pending_wallet_credit(
  target_user_id uuid,
  target_amount_cents integer,
  target_source_id uuid,
  target_idempotency_key text,
  target_description text default null
)
returns public.wallet_transactions as $$
declare
  wallet_row public.wallets;
  ledger_row public.wallet_transactions;
begin
  if target_amount_cents < 0 then raise exception 'Wallet credit cannot be negative'; end if;

  insert into public.wallets(user_id) values (target_user_id)
  on conflict (user_id) do nothing;

  select * into wallet_row from public.wallets
  where user_id = target_user_id for update;

  select * into ledger_row from public.wallet_transactions
  where idempotency_key = target_idempotency_key;
  if ledger_row.id is not null then return ledger_row; end if;

  insert into public.wallet_transactions(
    wallet_id, user_id, direction, amount_cents, transaction_type,
    balance_bucket, status, source_table, source_id, idempotency_key, description
  ) values (
    wallet_row.id, target_user_id, 'credit', target_amount_cents,
    'creator_revenue', 'pending', 'pending', 'creator_earnings',
    target_source_id, target_idempotency_key, target_description
  ) returning * into ledger_row;

  update public.wallets
  set pending_cents = pending_cents + target_amount_cents,
      updated_at = timezone('utc'::text, now())
  where id = wallet_row.id;

  return ledger_row;
end;
$$ language plpgsql security definer set search_path = public;