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

function integer(value) {
  return Number.isSafeInteger(Number(value)) ? Number(value) : 0;
}

function percentage(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function scoreForEvent(event, weights) {
  const watch = Math.min(1, event.watch_seconds / Math.max(event.video_duration_seconds, 1));
  const retention = event.completion_percent / 100;
  const riskFactor = event.risk_score > 40 ? 0 : 1 - (event.risk_score / 100);
  return (watch * percentage(weights.qualified_watch_time)
    + retention * percentage(weights.viewer_retention)) * riskFactor;
}

export async function runCreatorSettlement({ periodStart, periodEnd, calculationVersion = 'v1', actorId = null }) {
  const client = requireSupabase();
  const { data: settingsRows, error: settingsError } = await client
    .from('economy_settings')
    .select('key,value')
    .in('key', ['pool_allocations', 'creator_score_weights', 'feature_flags']);
  if (settingsError) throw settingsError;

  const settings = Object.fromEntries((settingsRows || []).map((row) => [row.key, row.value]));
  if (settings.feature_flags?.creator_revenue_sharing_enabled !== true) {
    const error = new Error('Creator revenue sharing is disabled.');
    error.status = 409;
    throw error;
  }

  const allocation = settings.pool_allocations || {};
  const creatorPercent = percentage(allocation.creator_pool_percent);
  const viewerPercent = percentage(allocation.viewer_reward_pool_percent);
  const reservePercent = percentage(allocation.platform_reserve_percent);
  if (Math.round((creatorPercent + viewerPercent + reservePercent) * 100) !== 10000) {
    const error = new Error('Pool allocation percentages must total 100%.');
    error.status = 500;
    throw error;
  }

  const [{ data: revenueRows, error: revenueError }, { data: events, error: eventsError }] = await Promise.all([
    client.from('platform_revenue')
      .select('id,gross_amount_cents,fees_cents,refund_amount_cents,net_amount_cents,currency')
      .eq('status', 'confirmed')
      .gte('created_at', `${periodStart}T00:00:00.000Z`)
      .lt('created_at', `${periodEnd}T23:59:59.999Z`),
    client.from('qualified_view_events')
      .select('creator_id,viewer_id,watch_seconds,video_duration_seconds,completion_percent,risk_score')
      .eq('status', 'qualified')
      .gte('created_at', `${periodStart}T00:00:00.000Z`)
      .lt('created_at', `${periodEnd}T23:59:59.999Z`),
  ]);
  if (revenueError) throw revenueError;
  if (eventsError) throw eventsError;

  const grossRevenueCents = (revenueRows || []).reduce((sum, row) => sum + integer(row.gross_amount_cents), 0);
  const feesCents = (revenueRows || []).reduce((sum, row) => sum + integer(row.fees_cents), 0);
  const refundsCents = (revenueRows || []).reduce((sum, row) => sum + integer(row.refund_amount_cents), 0);
  const netDistributableCents = Math.max(0, (revenueRows || []).reduce((sum, row) => sum + integer(row.net_amount_cents), 0) - refundsCents);
  const creatorPoolCents = Math.floor(netDistributableCents * creatorPercent / 100);
  const viewerPoolCents = Math.floor(netDistributableCents * viewerPercent / 100);
  const reserveCents = netDistributableCents - creatorPoolCents - viewerPoolCents;

  const { data: settlement, error: settlementError } = await client
    .from('economy_settlements')
    .insert({
      period_start: periodStart,
      period_end: periodEnd,
      calculation_version: calculationVersion,
      gross_revenue_cents: grossRevenueCents,
      fees_cents: feesCents,
      net_distributable_cents: netDistributableCents,
      allocation_snapshot: { creatorPercent, viewerPercent, reservePercent, creatorPoolCents, viewerPoolCents, reserveCents },
      status: 'calculating',
      created_by: actorId,
    })
    .select('id')
    .single();
  if (settlementError?.code === '23505') {
    const { data: existing, error } = await client.from('economy_settlements')
      .select('*').eq('period_start', periodStart).eq('period_end', periodEnd).eq('calculation_version', calculationVersion).single();
    if (error) throw error;
    return { duplicate: true, settlement: existing };
  }
  if (settlementError) throw settlementError;

  const poolRows = [
    ['creator_pool', creatorPercent, creatorPoolCents],
    ['viewer_reward_pool', viewerPercent, viewerPoolCents],
    ['platform_reserve', reservePercent, reserveCents],
  ].map(([pool_type, allocation_percent, amount_cents]) => ({
    settlement_id: settlement.id,
    pool_type,
    allocation_percent,
    amount_cents,
    status: 'allocated',
    settings_snapshot: allocation,
  }));
  const { error: poolError } = await client.from('revenue_pools').insert(poolRows);
  if (poolError) throw poolError;

  const weights = settings.creator_score_weights || {};
  const creatorScores = new Map();
  for (const event of events || []) {
    const score = scoreForEvent(event, weights);
    const current = creatorScores.get(event.creator_id) || { score: 0, watch: 0, views: 0, completions: 0, returning: new Set() };
    current.score += score;
    current.watch += integer(event.watch_seconds);
    current.views += 1;
    current.completions += event.completion_percent >= 90 ? 1 : 0;
    current.returning.add(event.viewer_id);
    creatorScores.set(event.creator_id, current);
  }

  const totalScore = [...creatorScores.values()].reduce((sum, row) => sum + row.score, 0);
  let allocatedCents = 0;
  const creatorRows = [...creatorScores.entries()].map(([creatorId, row]) => {
    const amount = totalScore > 0 ? Math.floor(creatorPoolCents * row.score / totalScore) : 0;
    allocatedCents += amount;
    return {
      creator_id: creatorId,
      settlement_id: settlement.id,
      period_start: periodStart,
      period_end: periodEnd,
      qualified_watch_seconds: row.watch,
      qualified_views: row.views,
      completions: row.completions,
      returning_viewers: row.returning.size,
      total_score: row.score,
      formula_snapshot: weights,
      fraud_status: 'normal',
      amount_cents: amount,
    };
  });

  for (const row of creatorRows) {
    const { data: earning, error: earningError } = await client.from('creator_earnings').insert({
      creator_id: row.creator_id,
      settlement_id: settlement.id,
      period_start: periodStart,
      period_end: periodEnd,
      amount_cents: row.amount_cents,
      status: 'pending',
      score: row.total_score,
      pool_share_percent: totalScore > 0 ? row.total_score / totalScore * creatorPercent : 0,
      calculation_snapshot: { totalScore, creatorPoolCents: creatorPoolCents, formula: weights },
    }).select('id').single();
    if (earningError) throw earningError;

    const { error: ledgerError } = await client.rpc('record_pending_wallet_credit', {
      target_user_id: row.creator_id,
      target_amount_cents: row.amount_cents,
      target_source_id: earning.id,
      target_idempotency_key: `settlement:${settlement.id}:creator:${row.creator_id}`,
      target_description: 'Creator settlement pending verification',
    });
    if (ledgerError) throw ledgerError;
  }

  const { error: completeError } = await client.from('economy_settlements')
    .update({ status: 'completed', score_snapshot: { totalScore, creators: creatorRows.length, allocatedCents }, completed_at: new Date().toISOString() })
    .eq('id', settlement.id);
  if (completeError) throw completeError;

  return { duplicate: false, settlementId: settlement.id, netDistributableCents, creatorPoolCents, allocatedCents };
}
