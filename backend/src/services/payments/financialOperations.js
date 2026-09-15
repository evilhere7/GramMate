import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';

const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

function requireSupabase() {
  if (!supabase) {
    const error = new Error('Supabase financial service is not configured on the server.');
    error.status = 503;
    throw error;
  }
  return supabase;
}

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function getActiveSubscriptionPlan(planId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileForPayment(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id,email,username,display_name,full_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertCheckoutTip({ senderId, creatorId, amountCents, currency, providerReference, platformFeeCents, creatorAmountCents }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('tips')
    .insert({
      sender_id: senderId,
      creator_id: creatorId,
      gross_amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      creator_amount_cents: creatorAmountCents,
      currency,
      status: 'pending_payment',
      provider_reference: providerReference,
      idempotency_key: `tip-checkout:${providerReference}`,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function recordSubscriptionFromStripe(subscription, userId, planId) {
  const client = requireSupabase();
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id || null;
  const periodStart = item?.current_period_start || subscription.current_period_start;
  const periodEnd = item?.current_period_end || subscription.current_period_end;
  const { error } = await client
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId || null,
      provider: 'stripe',
      provider_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      provider_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: toIso(periodStart),
      current_period_end: toIso(periodEnd),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      metadata: { price_id: priceId },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider,provider_subscription_id' });
  if (error) throw error;
}

export async function recordPlatformRevenue({ eventId, revenueType, grossAmountCents, feeCents = 0, currency = 'USD', reference, metadata = {} }) {
  const client = requireSupabase();
  const { error } = await client
    .from('platform_revenue')
    .insert({
      revenue_type: revenueType,
      provider: 'stripe',
      provider_transaction_id: reference,
      gross_amount_cents: grossAmountCents,
      fees_cents: feeCents,
      provider_fee_cents: feeCents,
      currency: currency.toUpperCase(),
      source_reference: reference,
      status: 'confirmed',
      metadata: { ...metadata, webhook_event_id: eventId },
      idempotency_key: `stripe-revenue:${eventId}`,
    });
  if (error?.code === '23505') return { duplicate: true };
  if (error) throw error;
  return { duplicate: false };
}

export async function updateTipFromCheckout({ session, status }) {
  const client = requireSupabase();
  const { error } = await client
    .from('tips')
    .update({ status, provider_reference: session.id })
    .eq('provider_reference', session.id);
  if (error) throw error;
}

export async function getTipByProviderReference(providerReference) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('tips')
    .select('id,sender_id,creator_id,gross_amount_cents,platform_fee_cents,creator_amount_cents,currency')
    .eq('provider_reference', providerReference)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertNotification({ userId, type, title, message, metadata = {} }) {
  const client = requireSupabase();
  const { error } = await client.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    metadata,
    is_read: false,
  });
  if (error && !['42P01', 'PGRST204'].includes(error.code)) throw error;
}

export async function getUserIdFromStripeMetadata(metadata = {}) {
  return metadata.grammate_user_id || metadata.user_id || null;
}
