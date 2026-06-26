import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, MoreHorizontal, Plus, TrendingUp, Clock, BadgeDollarSign, Heart, Users, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CreatorStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [watchTimeHours, setWatchTimeHours] = useState(0);

  useEffect(() => {
    const fetchStudioData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(pData);

        const { data: vData } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        const activeVideos = vData || [];
        setCreatorVideos(activeVideos);

        const { data: tData } = await supabase.from('transactions').select('*').eq('user_id', user.id).eq('status', 'cleared');
        setTransactions(tData || []);

        if (activeVideos.length > 0) {
          const videoIds = activeVideos.map(v => v.id);
          const { data: viewsData } = await supabase.from('video_views').select('watch_seconds').in('video_id', videoIds);
          const totalSeconds = (viewsData || []).reduce((sum, v) => sum + (v.watch_seconds || 0), 0);
          setWatchTimeHours(parseFloat((totalSeconds / 3600).toFixed(1)));
        } else {
          setWatchTimeHours(0);
        }
      } catch (err) {
        console.error('Error fetching creator studio data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudioData();
  }, [user]);

  const formatCurrency = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

  const formatNumber = (num) =>
    new Intl.NumberFormat('en', { notation: 'compact' }).format(num);

  const totalViews = creatorVideos.reduce((sum, v) => sum + (v.views_count || 0), 0);
  const totalLikes = creatorVideos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
  const totalComments = creatorVideos.reduce((sum, v) => sum + (v.comments_count || 0), 0);
  const totalSaves = creatorVideos.reduce((sum, v) => sum + (v.saves_count || 0), 0);
  const totalShares = creatorVideos.reduce((sum, v) => sum + (v.shares_count || 0), 0);
  const engagementSum = totalLikes + totalComments + totalSaves + totalShares;
  const engagementRate = totalViews > 0 ? ((engagementSum / totalViews) * 100).toFixed(1) + '%' : '0.0%';

  const revenueCents = transactions
    .filter(t => ['ad_share', 'tip', 'donation', 'sponsorship', 'campaign_reward'].includes(t.transaction_type))
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const adRevenueCents = transactions.filter(t => t.transaction_type === 'ad_share').reduce((sum, t) => sum + t.amount_cents, 0);
  const tipsDonationsCents = transactions.filter(t => ['tip', 'donation'].includes(t.transaction_type)).reduce((sum, t) => sum + t.amount_cents, 0);
  const sponsorCents = transactions.filter(t => t.transaction_type === 'sponsorship').reduce((sum, t) => sum + t.amount_cents, 0);
  const campaignCents = transactions.filter(t => t.transaction_type === 'campaign_reward').reduce((sum, t) => sum + t.amount_cents, 0);
  const breakdownTotal = adRevenueCents + tipsDonationsCents + sponsorCents + campaignCents;

  const revenueRows = [
    { source: 'Ad revenue share', cents: adRevenueCents, pct: breakdownTotal > 0 ? Math.round((adRevenueCents / breakdownTotal) * 100) : 0 },
    { source: 'Tips and donations', cents: tipsDonationsCents, pct: breakdownTotal > 0 ? Math.round((tipsDonationsCents / breakdownTotal) * 100) : 0 },
    { source: 'Sponsorship', cents: sponsorCents, pct: breakdownTotal > 0 ? Math.round((sponsorCents / breakdownTotal) * 100) : 0 },
    { source: 'Campaign rewards', cents: campaignCents, pct: breakdownTotal > 0 ? Math.round((campaignCents / breakdownTotal) * 100) : 0 },
  ];

  const creatorStats = [
    { label: 'Watch time', value: `${formatNumber(watchTimeHours)} hrs`, icon: Clock },
    { label: 'Revenue', value: formatCurrency(revenueCents), icon: BadgeDollarSign },
    { label: 'Engagement', value: engagementRate, icon: Heart },
    { label: 'Audience', value: formatNumber(profile?.followers_count || 0), icon: Users },
  ];

  if (loading && creatorVideos.length === 0) {
    return <div className="p-8 text-sm text-[var(--gm-text-secondary)]">Loading Creator Studio…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline text-[var(--gm-brand-light)]">Creator Studio</p>
          <h1 className="mt-2 text-h1 text-[var(--gm-text)]">Analytics, revenue, and uploads</h1>
          <p className="mt-2 max-w-2xl text-body text-[var(--gm-text-secondary)]">
            Monitor content performance, schedule videos, and understand exactly where creator earnings come from.
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gm-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--gm-brand-light)] transition-all active:scale-[0.97]"
        >
          <Plus size={16} aria-hidden="true" />
          New upload
        </button>
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {creatorStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="surface rounded-xl p-5 card-hover">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
                <Icon size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
              </div>
              <p className="mt-4 text-caption text-[var(--gm-text-secondary)]">{stat.label}</p>
              <p className="mt-1 text-h2 text-[var(--gm-text)]">{stat.value}</p>
            </article>
          );
        })}
      </section>

      {/* Analytics grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Revenue analytics */}
        <section className="surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 text-[var(--gm-text)]">Revenue analytics</h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
              <TrendingUp size={16} className="text-success" aria-hidden="true" />
            </div>
          </div>
          {revenueCents === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center p-6 text-center">
              <TrendingUp size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
              <p className="text-sm font-semibold text-[var(--gm-text-secondary)]">Not enough data yet</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {revenueRows.map((row) => (
                <div key={row.source}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--gm-text-secondary)]">{row.source}</span>
                    <span className="font-bold text-[var(--gm-text)]">{formatCurrency(row.cents)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--gm-surface-elevated)]">
                    <div
                      className="h-1.5 rounded-full gradient-brand transition-all duration-700"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audience analytics */}
        <section className="surface rounded-xl p-6">
          <h2 className="text-h3 text-[var(--gm-text)]">Audience analytics</h2>
          {totalViews === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center p-12 text-center">
              <BarChart3 size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
              <p className="text-sm font-semibold text-[var(--gm-text-secondary)]">Not enough data yet</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {['US 100%'].map((item) => (
                  <div key={item} className="rounded-lg border border-[var(--gm-border)] bg-[var(--gm-surface-elevated)] px-3 py-2.5 text-sm font-semibold text-[var(--gm-text)]">{item}</div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface-elevated)] p-4">
                <p className="text-caption text-[var(--gm-text-secondary)]">Best publishing window</p>
                <p className="mt-1 text-h2 text-[var(--gm-text)]">6:00 – 8:00 PM</p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Upload manager */}
      <section className="mt-6 surface rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--gm-border)] px-5 py-4">
          <h2 className="text-h3 text-[var(--gm-text)]">Upload manager</h2>
          <CalendarClock size={18} className="text-[var(--gm-text-tertiary)]" aria-hidden="true" />
        </div>
        {creatorVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarClock size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
            <p className="text-h3 text-[var(--gm-text)]">No videos uploaded yet</p>
            <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Videos you publish will be listed here with performance statistics.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border)]">
            {creatorVideos.map((video) => {
              const isScheduled = video.visibility === 'scheduled' && video.scheduled_at && new Date(video.scheduled_at) > new Date();
              return (
                <div key={video.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center hover:bg-[var(--gm-surface-elevated)] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[var(--gm-text)]">{video.title}</p>
                    <p className="mt-0.5 text-caption text-[var(--gm-text-secondary)]">
                      {video.category} · {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : '0:30'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    isScheduled
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-success/10 text-success border-success/20'
                  }`}>
                    <CheckCircle2 size={12} aria-hidden="true" />
                    {isScheduled ? 'Scheduled' : 'Live'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--gm-text-secondary)]">{formatNumber(video.likes_count || 0)} likes</span>
                  <button
                    className="rounded-lg p-1.5 text-[var(--gm-text-tertiary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)] transition-colors"
                    aria-label={`More actions for ${video.title}`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
