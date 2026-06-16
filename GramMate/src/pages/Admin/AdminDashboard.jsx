import { useEffect, useState } from 'react';
import { CheckCircle2, Headphones, Search, ShieldAlert, UserX, Users, FileVideo, Flag, LockKeyhole } from 'lucide-react';
import Logo from '../../components/brand/Logo';
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

      // 1. Total users
      const { count: usersCount, error: usersErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersErr) throw usersErr;

      // 2. Videos reviewed (moderation_status != 'pending')
      const { count: reviewedCount, error: videosErr } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .neq('moderation_status', 'pending');
      if (videosErr) throw videosErr;

      // 3. Open reports (status in ['open', 'reviewing'])
      const { count: reportsCount, error: reportsErr } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'reviewing']);
      if (reportsErr) throw reportsErr;

      // 4. Risk holds
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

      // 5. Fetch reports queue
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en').format(num);
  };

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
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <Logo size="sm" hoverGlow={false} />
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Admin Center</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Platform operations and trust</h1>
        </div>
        <label className="relative block md:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3" 
            placeholder="Search reports by reason or user" 
          />
        </label>
      </header>

      {loading && stats.totalUsers === 0 ? (
        <div className="p-8 text-slate-500">Loading Admin Dashboard...</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            {adminStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <Icon size={21} className="text-blue-600" />
                  </div>
                  <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
                </article>
              );
            })}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-bold text-slate-950">Admin modules</h2>
              <div className="mt-4 grid gap-2">
                {adminAreas.map((area) => (
                  <button key={area} className="rounded-md px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">{area}</button>
                ))}
              </div>
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-950">Fraud and moderation queue</h2>
                <ShieldAlert size={22} className="text-amber-600" />
              </div>
              {filteredQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                  <ShieldAlert size={36} className="mb-2 text-slate-400" />
                  <p className="text-lg font-bold text-slate-950">No pending moderation cases</p>
                  <p className="text-sm mt-1">There are no open reports requiring review.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredQueue.map((item) => (
                    <div key={item.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div>
                        <p className="font-bold text-slate-950">
                          {item.video ? `Report on video: "${item.video.title}"` : 'Report on account'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">Reason: {item.reason}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          By: @{item.reporter?.username || 'unknown'} - Target: @{item.reported_user?.username || 'unknown'}
                        </p>
                      </div>
                      <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 capitalize">
                        {item.status}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleResolveReport(item.id, 'Dismissed')}
                          className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                        >
                          Dismiss
                        </button>
                        <button 
                          onClick={() => handleResolveReport(item.id, 'Resolved / Enforced')}
                          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
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

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Withdrawal approvals', 'Review payout requests, KYC state, risk holds, and audit notes.', CheckCircle2],
          ['Support tickets', 'Resolve creator appeals, viewer reward disputes, and account issues.', Headphones],
          ['User enforcement', 'Warn, limit, block, or ban accounts with clear internal notes.', UserX],
        ].map(([title, copy, Icon]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon size={22} className="text-blue-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
