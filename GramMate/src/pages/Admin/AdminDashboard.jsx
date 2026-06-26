import { useEffect, useState } from 'react';
import { CheckCircle2, Headphones, Search, ShieldAlert, UserX, Users, FileVideo, Flag, LockKeyhole } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const adminAreas = ['User management', 'Video management', 'Reports', 'Earnings', 'Withdrawals', 'Fraud', 'Support'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    videosReviewed: 0,
    openReports: 0,
    riskHolds: 0,
  });
  const [reportsQueue, setReportsQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const { count: usersCount, error: usersErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersErr) throw usersErr;

      const { count: reviewedCount, error: videosErr } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .neq('moderation_status', 'pending');
      if (videosErr) throw videosErr;

      const { count: reportsCount, error: reportsErr } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'reviewing']);
      if (reportsErr) throw reportsErr;

      const { data: walletsData, error: walletsErr } = await supabase
        .from('wallets')
        .select('risk_hold_cents');
      if (walletsErr) throw walletsErr;
      const totalRiskHoldsCents = (walletsData || []).reduce((sum, w) => sum + (w.risk_hold_cents || 0), 0);

      setStats({
        totalUsers: usersCount || 0,
        videosReviewed: reviewedCount || 0,
        openReports: reportsCount || 0,
        riskHolds: totalRiskHoldsCents / 100,
      });

      const { data: queueData, error: queueErr } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          status,
          created_at,
          video:video_id (
            title,
            video_url
          ),
          reporter:reporter_id (
            username
          ),
          reported_user:reported_user_id (
            username
          )
        `)
        .in('status', ['open', 'reviewing'])
        .order('created_at', { ascending: false });

      if (queueErr) throw queueErr;
      setReportsQueue(queueData || []);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId, action) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolution: `Action taken: ${action}`,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      await fetchAdminData();
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num) =>
    new Intl.NumberFormat('en').format(num);

  const adminStats = [
    { label: 'Total users', value: formatNumber(stats.totalUsers), icon: Users },
    { label: 'Videos reviewed', value: formatNumber(stats.videosReviewed), icon: FileVideo },
    { label: 'Open reports', value: formatNumber(stats.openReports), icon: Flag },
    { label: 'Risk holds', value: formatCurrency(stats.riskHolds), icon: LockKeyhole },
  ];

  const filteredQueue = reportsQueue.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.reason.toLowerCase().includes(query) ||
      (item.video?.title || '').toLowerCase().includes(query) ||
      (item.reporter?.username || '').toLowerCase().includes(query) ||
      (item.reported_user?.username || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--gm-border)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-overline text-[var(--gm-brand-light)]">Admin Center</p>
          <h1 className="mt-2 text-h1 text-[var(--gm-text)]">Platform operations</h1>
          <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Trust, moderation, and platform health.</p>
        </div>
        <label className="relative block md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)]" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)] py-2.5 pl-10 pr-3 text-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-tertiary)] focus:border-[var(--gm-brand)] focus:outline-none transition-colors"
            placeholder="Search reports…"
          />
        </label>
      </header>

      {loading && stats.totalUsers === 0 ? (
        <div className="p-8 text-[var(--gm-text-secondary)] text-sm">Loading dashboard…</div>
      ) : (
        <>
          {/* Stat cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {adminStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="surface rounded-xl p-5 card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
                      <Icon size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-4 text-caption text-[var(--gm-text-secondary)]">{stat.label}</p>
                  <p className="mt-1 text-h2 text-[var(--gm-text)]">{stat.value}</p>
                </article>
              );
            })}
          </section>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Admin modules sidebar */}
            <aside className="surface rounded-xl p-5">
              <h2 className="text-h3 text-[var(--gm-text)]">Admin modules</h2>
              <nav className="mt-4 space-y-0.5">
                {adminAreas.map((area) => (
                  <button
                    key={area}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)] transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Moderation queue */}
            <section className="surface rounded-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--gm-border)] px-5 py-4">
                <h2 className="text-h3 text-[var(--gm-text)]">Moderation queue</h2>
                <ShieldAlert size={18} className="text-warning" />
              </div>
              {filteredQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <ShieldAlert size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
                  <p className="text-h3 text-[var(--gm-text)]">No pending cases</p>
                  <p className="mt-1 text-body text-[var(--gm-text-secondary)]">There are no open reports requiring review.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--gm-border)]">
                  {filteredQueue.map((item) => (
                    <div key={item.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div>
                        <p className="text-sm font-semibold text-[var(--gm-text)]">
                          {item.video ? `Video: "${item.video.title}"` : 'Account report'}
                        </p>
                        <p className="mt-1 text-caption text-[var(--gm-text-secondary)]">Reason: {item.reason}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--gm-text-tertiary)]">
                          By @{item.reporter?.username || 'unknown'} → @{item.reported_user?.username || 'unknown'}
                        </p>
                      </div>
                      <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning capitalize border border-warning/20">
                        {item.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(item.id, 'Dismissed')}
                          className="rounded-lg border border-[var(--gm-border)] px-3 py-1.5 text-xs font-semibold text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)] transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleResolveReport(item.id, 'Resolved / Enforced')}
                          className="rounded-lg bg-[var(--gm-text)] px-3 py-1.5 text-xs font-semibold text-[var(--gm-bg)] hover:opacity-80 transition-opacity"
                        >
                          Enforce
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Quick action cards */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Withdrawal approvals', 'Review payout requests, KYC state, risk holds, and audit notes.', CheckCircle2],
          ['Support tickets', 'Resolve creator appeals, viewer reward disputes, and account issues.', Headphones],
          ['User enforcement', 'Warn, limit, block, or ban accounts with clear internal notes.', UserX],
        ].map(([title, copy, Icon]) => (
          <article key={title} className="surface rounded-xl p-5 card-hover">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
              <Icon size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-h3 text-[var(--gm-text)]">{title}</h3>
            <p className="mt-2 text-caption text-[var(--gm-text-secondary)]">{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
