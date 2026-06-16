import { useEffect, useState } from 'react';
import { AtSign, BadgeCheck, Camera, Globe, Image as ImageIcon, Link as LinkIcon, Settings, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function CreatorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        setLoading(true);
        // Fetch profile
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const activeProfile = pData || {
          username: user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || 'GramMate Creator',
          avatar_url: null,
          cover_url: null,
          bio: 'Welcome to my GramMate profile. Watch my videos and let\'s earn together.',
          followers_count: 0,
          following_count: 0,
          is_verified: false,
          creator_badge: 'Creator',
          public_url: `grammate.com/@${user.email.split('@')[0]}`,
        };
        setProfile(activeProfile);

        // Fetch videos
        const { data: vData } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setCreatorVideos(vData || []);

        // Fetch wallet
        const { data: wData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setWallet(wData);
      } catch (error) {
        console.error('Error fetching creator profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileAndData();
  }, [user]);

  if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>;

  const totalLikes = creatorVideos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
  const totalEarnedCents = (wallet?.balance_cents || 0) + (wallet?.pending_cents || 0) + (wallet?.risk_hold_cents || 0);
  const formatCurrency = (cents) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en', { notation: 'compact' }).format(num);
  };

  return (
    <div className="pb-24 md:pb-8">
      <div className="h-56 border-b border-slate-200 bg-slate-200">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400"><Camera size={32} /></div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="-mt-16 grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-end">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={`${profile.full_name} avatar`} className="h-full w-full object-cover" /> : <ImageIcon size={36} className="text-slate-400" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-950">{profile.full_name}</h1>
              {profile.is_verified && <BadgeCheck size={24} className="text-blue-600" aria-label="Verified" />}
              {profile.creator_badge && (
                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{profile.creator_badge}</span>
              )}
            </div>
            <p className="mt-1 font-semibold text-slate-500">@{profile.username}</p>
            <p className="mt-4 max-w-2xl leading-7 text-slate-700">{profile.bio}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2"><Globe size={16} /> {profile.public_url}</span>
              <span className="inline-flex items-center gap-2"><AtSign size={16} /> Instagram</span>
              <span className="inline-flex items-center gap-2"><LinkIcon size={16} /> Portfolio</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"><UserPlus size={18} /> Follow</button>
            <button className="rounded-md border border-slate-300 p-3 text-slate-700 hover:bg-slate-50" aria-label="Profile settings"><Settings size={20} /></button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['Followers', formatNumber(profile.followers_count || 0)],
            ['Following', formatNumber(profile.following_count || 0)],
            ['Total likes', formatNumber(totalLikes)],
            ['Earned', formatCurrency(totalEarnedCents)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-950">Videos</h2>
            <span className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-700"><ShieldCheck size={16} /> Monetization active</span>
          </div>
          {creatorVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
              <Camera size={36} className="mb-2 text-slate-400" />
              <p className="text-lg font-bold text-slate-950">No videos uploaded yet</p>
              <p className="text-sm mt-1">Upload your first video to start building your audience!</p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatorVideos.map((video) => (
                <article key={video.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="aspect-video bg-slate-950">
                    <video src={video.video_url} className="h-full w-full object-cover" muted preload="metadata" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-slate-950">{video.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{formatNumber(video.likes_count || 0)} likes - ${video.reward_rate_per_min || '0.01'}/min</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
