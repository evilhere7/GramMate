import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';
import { getPaymentProvider } from './index.js';

const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

function requireServices() {
  const provider = getPaymentProvider();
  if (!supabase || !provider) {
    const error = new Error('Payout provider and Supabase financial service are not configured.');
    error.status = 503;
    throw error;
  }
  return { provider, client: supabase };
}

export async function processAutomaticPayout({ userId, settlementId = null, actorId = null }) {
  const { provider, client } = requireServices();
  const { data: settings, error: settingsError } = await client
    .from('payment_provider_settings')
    .select('key,value')
    .in('key', ['automatic_payouts_enabled', 'payout_schedule']);
  if (settingsError) throw settingsError;
  const settingMap = Object.fromEntries((settings || []).map((row) => [row.key, row.value]));
  if (settingMap.automatic_payouts_enabled !== true) {
    const error = new Error('Automatic payouts are disabled.');
    error.status = 409;
    throw error;
  }

  const [{ data: wallet, error: walletError }, { data: payoutAccount, error: accountError }] = await Promise.all([
    client.from('wallets').select('id,user_id,available_cents,risk_hold_cents').eq('user_id', userId).maybeSingle(),
    client.from('payout_accounts').select('*').eq('user_id', userId).eq('provider', 'stripe').maybeSingle(),
  ]);
  if (walletError) throw walletError;
  if (accountError) throw accountError;
  if (!wallet || wallet.available_cents <= 0) throw Object.assign(new Error('No available balance for payout.'), { status: 409 });
  if (!payoutAccount?.payouts_enabled || !payoutAccount.onboarding_complete) {
    throw Object.assign(new Error('A verified payout account is required.'), { status: 409 });
  }
  if (wallet.risk_hold_cents > 0) throw Object.assign(new Error('Account has funds under review.'), { status: 409 });

  const { data: fraud, error: fraudError } = await client
    .from('fraud_events')
    .select('id')
    .eq('user_id', userId)
    .in('fraud_status', ['review', 'restricted', 'blocked'])
    .limit(1);
  if (fraudError) throw fraudError;
  if (fraud?.length) throw Object.assign(new Error('Payout is unavailable while the account is under review.'), { status: 409 });

  const idempotencyKey = `payout:${userId}:${settlementId || 'available'}`;
  const { data: existing, error: existingError } = await client
    .from('payouts')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { duplicate: true, payout: existing };

  const { data: payout, error: payoutError } = await client.from('payouts').insert({
    user_id: userId,
    wallet_id: wallet.id,
    payout_account_id: payoutAccount.id,
    amount_cents: wallet.available_cents,
    currency: payoutAccount.currency?.toUpperCase() || 'USD',
    provider: 'stripe',
    status: 'processing',
    idempotency_key: idempotencyKey,
    metadata: { settlement_id: settlementId, requested_by: actorId, schedule: settingMap.payout_schedule || 'monthly' },
  }).select('*').single();
  if (payoutError) throw payoutError;

  try {
    const providerPayout = await provider.createPayout({
      amount: payout.amount_cents,
      currency: payout.currency.toLowerCase(),
      metadata: { grammate_payout_id: payout.id },
    }, {
      stripeAccount: payoutAccount.provider_account_id,
      idempotencyKey,
    });
    const { data: updated, error: updateError } = await client.from('payouts').update({
      provider_payout_id: providerPayout.id,
      status: 'processing',
      updated_at: new Date().toISOString(),
    }).eq('id', payout.id).select('*').single();
    if (updateError) throw updateError;
    return { duplicate: false, payout: updated };
  } catch (error) {
    await client.from('payouts').update({
      status: 'failed',
      failure_message: 'Provider rejected the payout request.',
      updated_at: new Date().toISOString(),
    }).eq('id', payout.id);
    throw error;
  }
}
