import React, { useCallback, useEffect, useState } from 'react';
import { BadgeDollarSign, BarChart3, Clock, Info, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import { fetchCreatorEconomy, fetchEconomySettings, fetchWalletSummary } from '../../services/economyService';

const money = (cents = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

export default function CreatorEarningsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [scores, setScores] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [settingsData, walletData, economyData] = await Promise.all([
        fetchEconomySettings(),
        fetchWalletSummary(user.id),
        fetchCreatorEconomy(user.id),
      ]);
      setSettings(settingsData);
      setWallet(walletData);
      setEarnings(economyData.earnings);
      setScores(economyData.scores);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <EmptyState
          icon={BadgeDollarSign}
          title="Sign in to view creator earnings"
          description="Creator revenue sharing depends on eligibility, qualified activity, and confirmed GramMate revenue."
          actionLabel="Sign In"
          onAction={() => window.location.assign('/login')}
        />
      </div>
    );
  }

  const flags = settings?.feature_flags || {};
  const allocations = settings?.pool_allocations || {};
  const weights = settings?.creator_score_weights || {};
  const eligibility = settings?.creator_eligibility_rules || {};
  const latestScore = scores[0];
  const confirmedEarnings = earnings.filter((row) => ['available', 'paid'].includes(row.status));
  const pendingEarnings = earnings.filter((row) => ['pending', 'review'].includes(row.status));
  const confirmedCents = confirmedEarnings.reduce((sum, row) => sum + (row.amount_cents || 0), 0);
  const pendingCents = pendingEarnings.reduce((sum, row) => sum + (row.amount_cents || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-[var(--gm-border)]">
        <div>
          <h1 className="text-2xl font-black text-[var(--gm-text)] tracking-tight">Creator Earnings</h1>
          <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
            Revenue sharing is proportional to qualified creator activity and confirmed monthly revenue pools.
          </p>
        </div>
        <span className={`gm-badge ${flags.creator_revenue_sharing_enabled ? 'gm-badge-success' : 'gm-badge-warning'}`}>
          {flags.creator_revenue_sharing_enabled ? 'Revenue sharing active' : 'Revenue sharing not active'}
        </span>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Available creator cash', value: money(wallet?.available_cents || 0), icon: BadgeDollarSign },
          { label: 'Pending creator cash', value: money(pendingCents || wallet?.pending_cents || 0), icon: Clock },
          { label: 'Confirmed earnings', value: money(confirmedCents), icon: ShieldCheck },
          { label: 'Latest score', value: latestScore ? Number(latestScore.total_score || 0).toFixed(2) : '0.00', icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="gm-card p-5">
              <Icon size={18} className="text-[var(--gm-brand)]" aria-hidden="true" />
              <p className="mt-4 text-xs uppercase tracking-wider text-[var(--gm-text-tertiary)] font-bold">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-[var(--gm-text)]">{loading ? '-' : item.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="gm-card overflow-hidden">
          <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
            <h2 className="text-sm font-bold">Earnings Ledger</h2>
            <span className="text-xs text-[var(--gm-text-tertiary)]">{earnings.length} entries</span>
          </div>
          {earnings.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={TrendingUp}
                title="No creator earnings yet"
                description="Your earnings will appear here once you become eligible and GramMate settles confirmed revenue."
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--gm-border)]">
              {earnings.map((earning) => (
                <div key={earning.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[var(--gm-text)]">{earning.source_type?.replace(/_/g, ' ') || 'creator revenue'}</p>
                    <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                      {earning.period_start} to {earning.period_end} · score {Number(earning.score || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">{money(earning.amount_cents)}</p>
                    <span className="text-[10px] font-semibold uppercase text-amber-400">{earning.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="gm-card p-5">
            <h2 className="text-sm font-bold text-[var(--gm-text)]">Creator Score Formula</h2>
            <div className="mt-4 space-y-3 text-xs">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-[var(--gm-text-secondary)]">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--gm-surface-elevated)]">
                    <div className="h-1.5 rounded-full bg-[var(--gm-brand)]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gm-card p-5">
            <h2 className="text-sm font-bold text-[var(--gm-text)]">Eligibility Snapshot</h2>
            <ul className="mt-3 space-y-2 text-xs text-[var(--gm-text-secondary)]">
              <li>Minimum account age: {eligibility.minimum_account_age_days || 0} days</li>
              <li>Minimum followers: {(eligibility.minimum_followers || 0).toLocaleString()}</li>
              <li>Qualified watch time: {Math.round((eligibility.minimum_qualified_watch_seconds || 0) / 3600)} hours</li>
              <li>Email verification and good standing required when configured.</li>
            </ul>
          </div>

          <div className="gm-card p-5">
            <div className="flex gap-3">
              <Info size={18} className="text-[var(--gm-brand)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--gm-text-secondary)]">
                Creator pool allocation is currently {allocations.creator_pool_percent || 0}% of net distributable revenue. Earnings are never fixed per view and may be delayed for settlement or fraud review.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
