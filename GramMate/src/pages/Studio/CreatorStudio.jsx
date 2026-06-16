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

        // 1. Fetch profile for followers count
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(pData);

        // 2. Fetch creator videos
        const { data: vData } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        const activeVideos = vData || [];
        setCreatorVideos(activeVideos);

        // 3. Fetch transactions for revenue
        const { data: tData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'cleared');
        setTransactions(tData || []);

        // 4. Fetch watch time from video views
        if (activeVideos.length > 0) {
          const videoIds = activeVideos.map(v => v.id);
          const { data: viewsData } = await supabase
            .from('video_views')
            .select('watch_seconds')
            .in('video_id', videoIds);

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

  const formatCurrency = (cents) => {
    const dollars = (cents || 0) / 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en', { notation: 'compact' }).format(num);
  };

  // Calculations
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

  // Revenue breakdown
  const adRevenueCents = transactions.filter(t => t.transaction_type === 'ad_share').reduce((sum, t) => sum + t.amount_cents, 0);
  const tipsDonationsCents = transactions.filter(t => ['tip', 'donation'].includes(t.transaction_type)).reduce((sum, t) => sum + t.amount_cents, 0);
  const sponsorCents = transactions.filter(t => t.transaction_type === 'sponsorship').reduce((sum, t) => sum + t.amount_cents, 0);
  const campaignCents = transactions.filter(t => t.transaction_type === 'campaign_reward').reduce((sum, t) => sum + t.amount_cents, 0);

  const breakdownTotal = adRevenueCents + tipsDonationsCents + sponsorCents + campaignCents;

  const revenueRows = [
    { source: 'Ad revenue share', cents: adRevenueCents, share: breakdownTotal > 0 ? Math.round((adRevenueCents / breakdownTotal) * 100) + '%' : '0%' },
    { source: 'Tips and donations', cents: tipsDonationsCents, share: breakdownTotal > 0 ? Math.round((tipsDonationsCents / breakdownTotal) * 100) + '%' : '0%' },
    { source: 'Sponsorship marketplace', cents: sponsorCents, share: breakdownTotal > 0 ? Math.round((sponsorCents / breakdownTotal) * 100) + '%' : '0%' },
    { source: 'Campaign rewards', cents: campaignCents, share: breakdownTotal > 0 ? Math.round((campaignCents / breakdownTotal) * 100) + '%' : '0%' },
  ];

  const creatorStats = [
    { label: 'Watch time', value: `${formatNumber(watchTimeHours)} hrs`, icon: Clock },
    { label: 'Revenue', value: formatCurrency(revenueCents), icon: BadgeDollarSign },
    { label: 'Engagement', value: engagementRate, icon: Heart },
    { label: 'Audience', value: formatNumber(profile?.followers_count || 0), icon: Users },
  ];

  if (loading && creatorVideos.length === 0) {
    return <div className="p-8 text-slate-500">Loading Creator Studio...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Creator Studio</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Analytics, revenue, and uploads</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Monitor content performance, schedule videos, and understand exactly where creator earnings come from.</p>
        </div>
        <button 
          onClick={() => navigate('/upload')}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} aria-hidden="true" />
          New upload
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {creatorStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-blue-600" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
            </article>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">Revenue analytics</h2>
            <TrendingUp size={20} className="text-green-600" aria-hidden="true" />
          </div>
          {revenueCents === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center p-6 text-slate-400">
              <TrendingUp size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Not enough data yet</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {revenueRows.map((row) => (
                <div key={row.source}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{row.source}</span>
                    <span className="font-bold text-slate-950">{formatCurrency(row.cents)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: row.share }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Audience analytics</h2>
          {totalViews === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center p-12 text-slate-400">
              <BarChart3 size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Not enough data yet</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {['US 100%'].map((item) => (
                  <div key={item} className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-700">{item}</div>
                ))}
              </div>
              <div className="mt-6 rounded-md border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Best publishing window</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">6:00 PM - 8:00 PM</p>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-950">Upload manager</h2>
          <CalendarClock size={20} className="text-slate-500" aria-hidden="true" />
        </div>
        {creatorVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <CalendarClock size={36} className="mb-2 text-slate-400" />
            <p className="text-lg font-bold text-slate-950">No videos uploaded yet</p>
            <p className="text-sm mt-1">Videos you publish will be listed here with performance statistics.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {creatorVideos.map((video) => {
              const isScheduled = video.visibility === 'scheduled' && video.scheduled_at && new Date(video.scheduled_at) > new Date();
              return (
                <div key={video.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div>
                    <p className="font-bold text-slate-950">{video.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {video.category} - {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : '0:30'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${isScheduled ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {isScheduled ? 'Scheduled' : 'Live'}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">{formatNumber(video.likes_count || 0)} likes</span>
                  <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={`More actions for ${video.title}`}>
                    <MoreHorizontal size={20} />
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
