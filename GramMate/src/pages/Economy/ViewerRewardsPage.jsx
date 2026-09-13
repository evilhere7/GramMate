import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Info, ShieldAlert, Sparkles, Trophy, WalletCards } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import { fetchEconomySettings, fetchViewerRewards, fetchWalletSummary } from '../../services/economyService';

const money = (cents = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

export default function ViewerRewardsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [scores, setScores] = useState([]);
  const [events, setEvents] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [settingsData, walletData, rewardData] = await Promise.all([
        fetchEconomySettings(),
        fetchWalletSummary(user.id),
        fetchViewerRewards(user.id),
      ]);
      setSettings(settingsData);
      setWallet(walletData);
      setRewards(rewardData.rewards);
      setScores(rewardData.scores);
      setEvents(rewardData.events);
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
          icon={Gift}
          title="Sign in to view viewer rewards"
          description="Viewer rewards are based on legitimate participation and a limited monthly reward pool."
          actionLabel="Sign In"
          onAction={() => window.location.assign('/login')}
        />
      </div>
    );
  }

  const flags = settings?.feature_flags || {};
  const rewardRules = settings?.viewer_reward_rules || {};
  const qualifiedRules = settings?.qualified_view_rules || {};
  const latestScore = scores[0];
  const estimatedCents = rewards.reduce((sum, row) => sum + (row.estimated_amount_cents || 0), 0);
  const confirmedCents = rewards.reduce((sum, row) => sum + (row.confirmed_amount_cents || 0), 0);
  const pointsFromRewards = rewards.reduce((sum, row) => sum + (row.points || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-[var(--gm-border)]">
        <div>
          <h1 className="text-2xl font-black text-[var(--gm-text)] tracking-tight">Viewer Rewards</h1>
          <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
            Points and rewards are earned through legitimate participation, not repeated opens or spam.
          </p>
        </div>
        <span className={`gm-badge ${flags.viewer_rewards_enabled ? 'gm-badge-success' : 'gm-badge-warning'}`}>
          {flags.viewer_rewards_enabled ? 'Viewer rewards active' : 'Viewer rewards not active'}
        </span>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Points balance', value: (wallet?.points_balance || 0).toLocaleString(), icon: Gift },
          { label: 'Lifetime points', value: ((wallet?.points_lifetime_earned || 0) + pointsFromRewards).toLocaleString(), icon: Trophy },
          { label: 'Estimated reward', value: money(estimatedCents), icon: Sparkles },
          { label: 'Confirmed reward', value: money(confirmedCents), icon: WalletCards },
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

      <div className="mb-6 rounded-lg border border-sky-500/25 bg-sky-500/10 p-4 text-xs text-sky-100">
        <div className="flex gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-300" />
          <p>
            Estimated rewards are not guaranteed cash. Monthly rewards depend on confirmed viewer reward pool size, eligible reward score, and fraud review.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="gm-card overflow-hidden">
          <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
            <h2 className="text-sm font-bold">Reward History</h2>
            <span className="text-xs text-[var(--gm-text-tertiary)]">{rewards.length} entries</span>
          </div>
          {rewards.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Gift}
                title="You have not earned rewards yet"
                description="Legitimate reward history will appear after viewer rewards are enabled and qualified activity is settled."
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--gm-border)]">
              {rewards.map((reward) => (
                <div key={reward.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[var(--gm-text)]">
                      {reward.status === 'estimated' ? 'Estimated viewer reward' : 'Viewer reward'}
                    </p>
                    <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                      {reward.period_start} to {reward.period_end} · {reward.points.toLocaleString()} points
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">{money(reward.confirmed_amount_cents || reward.estimated_amount_cents)}</p>
                    <span className="text-[10px] font-semibold uppercase text-amber-400">{reward.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="gm-card p-5">
            <h2 className="text-sm font-bold text-[var(--gm-text)]">Reward Score</h2>
            <div className="mt-4 rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--gm-text-tertiary)] font-bold">Latest monthly score</p>
              <p className="mt-1 text-3xl font-black">{latestScore ? Number(latestScore.reward_score || 0).toFixed(2) : '0.00'}</p>
              <p className="mt-1 text-xs text-[var(--gm-text-secondary)]">
                {latestScore ? `${latestScore.qualified_events_count || 0} qualified events` : 'No score snapshot yet'}
              </p>
            </div>
          </div>

          <div className="gm-card p-5">
            <h2 className="text-sm font-bold text-[var(--gm-text)]">Limits and Thresholds</h2>
            <ul className="mt-3 space-y-2 text-xs text-[var(--gm-text-secondary)]">
              <li>Daily points limit: {(rewardRules.daily_points_limit || 0).toLocaleString()}</li>
              <li>Monthly points limit: {(rewardRules.monthly_points_limit || 0).toLocaleString()}</li>
              <li>Minimum watch: {qualifiedRules.minimum_watch_seconds || 0} seconds</li>
              <li>Minimum completion: {qualifiedRules.minimum_percent_watched || 0}%</li>
              <li>Maximum qualifying risk score: {qualifiedRules.max_risk_score || 0}</li>
            </ul>
          </div>

          <div className="gm-card overflow-hidden">
            <div className="p-4 border-b border-[var(--gm-border)]">
              <h2 className="text-sm font-bold">Recent Reward Events</h2>
            </div>
            {events.length === 0 ? (
              <div className="p-5 flex gap-3 text-xs text-[var(--gm-text-secondary)]">
                <ShieldAlert size={16} className="text-[var(--gm-text-tertiary)] shrink-0" />
                Reward events are recorded by trusted server logic after fraud and cooldown checks.
              </div>
            ) : (
              <div className="divide-y divide-[var(--gm-border)]">
                {events.map((event) => (
                  <div key={event.id} className="p-4 text-xs flex items-center justify-between">
                    <span className="font-semibold capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-[var(--gm-text-secondary)]">{event.points.toLocaleString()} pts · {event.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
