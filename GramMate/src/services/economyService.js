import { supabase } from '../lib/supabase';

const DEFAULT_SETTINGS = {
  feature_flags: {
    creator_revenue_sharing_enabled: false,
    viewer_rewards_enabled: false,
    tips_enabled: false,
    creator_subscriptions_enabled: false,
    referrals_enabled: false,
    marketplace_enabled: false,
    advertising_enabled: false,
    withdrawals_enabled: false,
  },
  pool_allocations: {
    creator_pool_percent: 70,
    viewer_reward_pool_percent: 10,
    platform_reserve_percent: 20,
  },
  creator_score_weights: {
    qualified_watch_time: 50,
    viewer_retention: 20,
    meaningful_engagement: 15,
    returning_viewers: 10,
    shares_saves: 5,
  },
  qualified_view_rules: {
    minimum_watch_seconds: 10,
    minimum_percent_watched: 40,
    max_risk_score: 40,
    same_viewer_cooldown_hours: 6,
  },
  viewer_reward_rules: {
    daily_points_limit: 500,
    monthly_points_limit: 5000,
    point_to_currency_rate: 0.0001,
    minimum_redemption_cents: 500,
    cooldown_seconds: 60,
  },
  creator_eligibility_rules: {
    minimum_account_age_days: 30,
    minimum_followers: 100,
    minimum_qualified_watch_seconds: 36000,
    requires_verified_email: true,
    requires_good_standing: true,
  },
  payment_provider_status: {
    stripe: 'not_configured',
    paypal: 'not_configured',
    esewa: 'not_configured',
    khalti: 'not_configured',
    bank_transfer: 'not_configured',
    advertising_provider: 'not_configured',
  },
};

function cents(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function withFallbackSettings(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, { ...DEFAULT_SETTINGS });
}

function isMissingTableError(error) {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache');
}

export async function fetchEconomySettings() {
  try {
    const { data, error } = await supabase
      .from('economy_settings')
      .select('key,value,is_public,description')
      .or('is_public.eq.true,key.in.(feature_flags,pool_allocations,payment_provider_status)');

    if (error) throw error;
    return withFallbackSettings(data || []);
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] settings warning:', err?.message || err);
    }
    return { ...DEFAULT_SETTINGS };
  }
}

export async function fetchWalletSummary(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return {
      id: data?.id,
      user_id: userId,
      available_cents: cents(data?.available_cents ?? data?.balance_cents),
      pending_cents: cents(data?.pending_cents),
      risk_hold_cents: cents(data?.risk_hold_cents),
      lifetime_earned_cents: cents(data?.lifetime_earned_cents),
      lifetime_withdrawn_cents: cents(data?.lifetime_withdrawn_cents),
      lifetime_rewards_cents: cents(data?.lifetime_rewards_cents),
      points_balance: cents(data?.points_balance),
      points_lifetime_earned: cents(data?.points_lifetime_earned),
      payout_status: data?.payout_status || 'not_configured',
      updated_at: data?.updated_at,
    };
  } catch (err) {
    console.warn('[economyService] wallet warning:', err?.message || err);
    return {
      user_id: userId,
      available_cents: 0,
      pending_cents: 0,
      risk_hold_cents: 0,
      lifetime_earned_cents: 0,
      lifetime_withdrawn_cents: 0,
      lifetime_rewards_cents: 0,
      points_balance: 0,
      points_lifetime_earned: 0,
      payout_status: 'not_configured',
    };
  }
}

export async function fetchWalletLedger(userId, limit = 50) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] ledger warning:', err?.message || err);
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map((tx) => ({
      ...tx,
      direction: cents(tx.amount_cents) >= 0 ? 'credit' : 'debit',
      amount_cents: Math.abs(cents(tx.amount_cents)),
      balance_bucket: tx.status === 'cleared' || tx.status === 'completed' ? 'available' : 'pending',
      transaction_type: tx.transaction_type || 'adjustment',
    }));
  }
}

export async function fetchWithdrawalRequests(userId, limit = 20) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] withdrawals warning:', err?.message || err);
    }
    return [];
  }
}

export async function submitWithdrawalRequest({ amountCents, payoutMethod, destinationLabel }) {
  const idempotencyKey = `withdrawal:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const { data, error } = await supabase.rpc('request_wallet_withdrawal', {
    request_amount_cents: amountCents,
    request_payout_method: payoutMethod,
    request_destination_label: destinationLabel || null,
    request_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw new Error(error.message || 'Your withdrawal could not be submitted. Please try again.');
  }
  return data;
}

export async function fetchCreatorEconomy(userId) {
  if (!userId) return { earnings: [], scores: [] };
  try {
    const [earningsResult, scoresResult] = await Promise.all([
      supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('creator_scores')
        .select('*')
        .eq('creator_id', userId)
        .order('period_end', { ascending: false })
        .limit(12),
    ]);

    if (earningsResult.error) throw earningsResult.error;
    if (scoresResult.error) throw scoresResult.error;
    return {
      earnings: earningsResult.data || [],
      scores: scoresResult.data || [],
    };
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] creator economy warning:', err?.message || err);
    }
    return { earnings: [], scores: [] };
  }
}

export async function fetchViewerRewards(userId) {
  if (!userId) return { rewards: [], scores: [], events: [] };
  try {
    const [rewardsResult, scoresResult, eventsResult] = await Promise.all([
      supabase
        .from('viewer_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('viewer_scores')
        .select('*')
        .eq('user_id', userId)
        .order('period_end', { ascending: false })
        .limit(12),
      supabase
        .from('reward_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (rewardsResult.error) throw rewardsResult.error;
    if (scoresResult.error) throw scoresResult.error;
    if (eventsResult.error) throw eventsResult.error;
    return {
      rewards: rewardsResult.data || [],
      scores: scoresResult.data || [],
      events: eventsResult.data || [],
    };
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] viewer rewards warning:', err?.message || err);
    }
    return { rewards: [], scores: [], events: [] };
  }
}

export async function fetchAdminEconomyOverview() {
  try {
    const [
      revenue,
      pools,
      settlements,
      withdrawals,
      fraud,
      walletLedger,
      settings,
    ] = await Promise.all([
      supabase.from('platform_revenue').select('revenue_type,gross_amount_cents,fees_cents,net_amount_cents,status').limit(500),
      supabase.from('revenue_pools').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('economy_settlements').select('*').order('created_at', { ascending: false }).limit(12),
      supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('fraud_events').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(50),
      fetchEconomySettings(),
    ]);

    const revenueRows = revenue.error ? [] : revenue.data || [];
    const confirmedRevenue = revenueRows.filter((row) => row.status === 'confirmed');
    const grossRevenueCents = confirmedRevenue.reduce((sum, row) => sum + cents(row.gross_amount_cents), 0);
    const netRevenueCents = confirmedRevenue.reduce((sum, row) => sum + cents(row.net_amount_cents), 0);
    const feesCents = confirmedRevenue.reduce((sum, row) => sum + cents(row.fees_cents), 0);
    const byType = confirmedRevenue.reduce((acc, row) => {
      acc[row.revenue_type] = (acc[row.revenue_type] || 0) + cents(row.net_amount_cents);
      return acc;
    }, {});

    const ledgerRows = walletLedger.error ? [] : walletLedger.data || [];
    const pendingPayoutCents = (withdrawals.error ? [] : withdrawals.data || [])
      .filter((row) => ['pending_review', 'approved'].includes(row.status))
      .reduce((sum, row) => sum + cents(row.amount_cents), 0);

    return {
      settings,
      revenue: {
        grossRevenueCents,
        netRevenueCents,
        feesCents,
        byType,
      },
      pools: pools.error ? [] : pools.data || [],
      settlements: settlements.error ? [] : settlements.data || [],
      withdrawals: withdrawals.error ? [] : withdrawals.data || [],
      fraudEvents: fraud.error ? [] : fraud.data || [],
      walletLedger: ledgerRows,
      pendingPayoutCents,
      pointsIssued: ledgerRows.reduce((sum, row) => sum + cents(row.points), 0),
      creatorCreditsCents: ledgerRows
        .filter((row) => ['creator_revenue', 'tip_received', 'subscription_revenue'].includes(row.transaction_type))
        .reduce((sum, row) => sum + cents(row.amount_cents), 0),
      viewerRewardCents: ledgerRows
        .filter((row) => row.transaction_type === 'viewer_reward')
        .reduce((sum, row) => sum + cents(row.amount_cents), 0),
    };
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[economyService] admin overview warning:', err?.message || err);
    }
    return {
      settings: { ...DEFAULT_SETTINGS },
      revenue: { grossRevenueCents: 0, netRevenueCents: 0, feesCents: 0, byType: {} },
      pools: [],
      settlements: [],
      withdrawals: [],
      fraudEvents: [],
      walletLedger: [],
      pendingPayoutCents: 0,
      pointsIssued: 0,
      creatorCreditsCents: 0,
      viewerRewardCents: 0,
    };
  }
}

export { DEFAULT_SETTINGS };
