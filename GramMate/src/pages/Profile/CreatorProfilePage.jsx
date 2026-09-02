import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Settings, 
  UserPlus, 
  UserCheck, 
  Gift, 
  Play, 
  Eye, 
  Heart, 
  DollarSign, 
  Share2, 
  Video, 
  BarChart3, 
  Coins, 
  X 
} from 'lucide-react';

const MOCK_VIDEOS = [
  {
    id: 'v1',
    title: 'Tokyo Street Vibes at Midnight 🌃',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80',
    views: '124.5K',
    likes: '14.2K',
    earnings: '$54.20',
    duration: '0:45',
    date: '2 days ago'
  },
  {
    id: 'v2',
    title: 'AI Workflow Secrets for 2026 🚀',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    views: '89.1K',
    likes: '9.8K',
    earnings: '$38.90',
    duration: '1:12',
    date: '4 days ago'
  },
  {
    id: 'v3',
    title: 'How I Monetized My First 10k Followers 💰',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
    views: '210.4K',
    likes: '28.3K',
    earnings: '$112.50',
    duration: '2:05',
    date: '1 week ago'
  },
  {
    id: 'v4',
    title: 'Cyberpunk Synth Beats Studio Session 🎧',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    views: '45.0K',
    likes: '5.1K',
    earnings: '$18.40',
    duration: '0:58',
    date: '2 weeks ago'
  },
  {
    id: 'v5',
    title: 'Web3 & Watch-to-Earn Deep Dive 🌐',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&auto=format&fit=crop&q=80',
    views: '67.8K',
    likes: '8.4K',
    earnings: '$29.10',
    duration: '1:30',
    date: '3 weeks ago'
  },
  {
    id: 'v6',
    title: 'Night Walk in Shibuya with 4K HDR 🎥',
    thumbnail: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&auto=format&fit=crop&q=80',
    views: '98.2K',
    likes: '11.9K',
    earnings: '$41.80',
    duration: '1:15',
    date: '1 month ago'
  }
];

export default function CreatorProfilePage() {
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(14800);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);
  const [selectedTip, setSelectedTip] = useState('2.00');
  const [showEditModal, setShowEditModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const creator = {
    username: 'alex_creator',
    displayName: 'Alex Rivera',
    bio: 'Visual artist & tech enthusiast building the future of short-form entertainment on GramMate. 🎥✨ Watch & earn with me!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    totalEarnings: 294.90,
    followingCount: 342,
    totalViews: '635.1K',
    engagementRate: '8.4%'
  };

  const handleFollowToggle = () => {
    setIsFollowing(prev => !prev);
    setFollowersCount(prev => prev + (isFollowing ? -1 : 1));
  };

  const handleCopyProfile = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-full w-full bg-zinc-950 text-white pb-24 md:pb-12">
      {/* Banner & Hero Header */}
      <div className="relative w-full h-48 md:h-64 bg-zinc-900 overflow-hidden">
        <img 
          src={creator.banner} 
          alt="Banner" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
        {/* Creator Info Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with Glow Ring */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-xl relative z-10 bg-zinc-800">
                <img src={creator.avatar} alt={creator.displayName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary to-secondary opacity-70 blur-sm group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {creator.displayName}
                </h1>
                {creator.isVerified && (
                  <span className="flex items-center gap-1 bg-secondary/15 text-secondary border border-secondary/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    <Check size={12} className="stroke-[3]" /> Verified Creator
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-primary mb-3">@{creator.username}</p>
              
              <p className="text-sm text-zinc-300 max-w-xl mb-5 leading-relaxed">
                {creator.bio}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    isFollowing
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-750'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'
                  }`}
                >
                  {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>

                <button
                  onClick={() => setShowTipModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/40 hover:border-amber-500 text-amber-300 rounded-xl font-bold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <Gift size={16} />
                  <span>Tip Creator</span>
                </button>

                <button
                  onClick={handleCopyProfile}
                  className="p-2.5 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 transition-colors"
                  title="Share Profile"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                </button>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2.5 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 transition-colors"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">Followers</span>
                <span className="text-lg font-bold text-white">{(followersCount).toLocaleString()}</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">Total Views</span>
                <span className="text-lg font-bold text-secondary">{creator.totalViews}</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">Earned</span>
                <span className="text-lg font-bold text-emerald-400">${creator.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">Engagement</span>
                <span className="text-lg font-bold text-primary">{creator.engagementRate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-zinc-800 mb-8">
          {[
            { id: 'videos', label: 'Videos', icon: Video, count: MOCK_VIDEOS.length },
            { id: 'analytics', label: 'Analytics & Growth', icon: BarChart3 },
            { id: 'monetization', label: 'Monetization Hub', icon: Coins }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-bold text-sm transition-colors flex items-center gap-2 relative ${
                  isActive ? 'text-primary' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="profile-tab-active"
                    className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content: Videos */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            {MOCK_VIDEOS.map(video => (
              <motion.div
                key={video.id}
                whileHover={{ y: -4 }}
                className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:border-primary/40 transition-all flex flex-col"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  {/* Duration Tag */}
                  <span className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-[11px] font-bold px-2 py-0.5 rounded-md text-zinc-300 border border-white/10">
                    {video.duration}
                  </span>

                  {/* Earnings Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-emerald-500/20 backdrop-blur-sm text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <DollarSign size={11} /> {video.earnings}
                  </span>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="p-3.5 rounded-full bg-primary text-white shadow-lg shadow-primary/40">
                      <Play size={22} className="fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Views & Likes stats */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs font-semibold text-zinc-300">
                    <div className="flex items-center gap-1">
                      <Eye size={13} className="text-secondary" />
                      <span>{video.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={13} className="text-primary" />
                      <span>{video.likes}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <span className="text-[11px] text-zinc-500 mt-1">{video.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab Content: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs font-medium text-zinc-400 block mb-1">Avg Watch Duration</span>
                <p className="text-2xl font-bold text-white">48.2s <span className="text-xs font-semibold text-emerald-400">+14% vs last mo</span></p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs font-medium text-zinc-400 block mb-1">Watch-To-Earn Multiplier</span>
                <p className="text-2xl font-bold text-secondary">1.8x <span className="text-xs font-semibold text-zinc-400">(Top Tier)</span></p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs font-medium text-zinc-400 block mb-1">Audience Retention</span>
                <p className="text-2xl font-bold text-primary">76.4% <span className="text-xs font-semibold text-emerald-400">High Viral</span></p>
              </div>
            </div>

            {/* Weekly Performance Bar Chart */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>7-Day Viewer Engagement & Revenue</span>
                <span className="text-xs text-zinc-500">Updated Hourly</span>
              </h3>

              <div className="space-y-3.5 pt-2">
                {[
                  { day: 'Mon', revenue: '$34.20', pct: 60 },
                  { day: 'Tue', revenue: '$48.50', pct: 85 },
                  { day: 'Wed', revenue: '$41.10', pct: 72 },
                  { day: 'Thu', revenue: '$59.80', pct: 95 },
                  { day: 'Fri', revenue: '$52.40', pct: 88 },
                  { day: 'Sat', revenue: '$64.20', pct: 100 },
                  { day: 'Sun', revenue: '$39.00', pct: 68 }
                ].map(item => (
                  <div key={item.day} className="flex items-center gap-3">
                    <span className="w-10 text-xs font-semibold text-zinc-400">{item.day}</span>
                    <div className="flex-1 h-7 bg-zinc-950 rounded-lg overflow-hidden p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-md bg-gradient-to-r from-primary to-secondary flex items-center justify-end pr-2"
                      >
                        <span className="text-[11px] font-extrabold text-black">{item.revenue}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Monetization */}
        {activeTab === 'monetization' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Creator Balance</span>
                  <h2 className="text-4xl font-extrabold text-white mt-1">${creator.totalEarnings.toFixed(2)}</h2>
                  <p className="text-xs text-zinc-400 mt-1">Earnings accrued via Watch-to-Earn pool + viewer tips</p>
                </div>
                <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                  Withdraw to USDC / Bank
                </button>
              </div>
            </div>

            {/* Income breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h4 className="font-bold text-white text-sm mb-3">Revenue Streams</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800">
                    <span className="text-zinc-400">Watch-To-Earn Pool (60%)</span>
                    <span className="font-bold text-white">$176.94</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800">
                    <span className="text-zinc-400">Direct Viewer Tips (30%)</span>
                    <span className="font-bold text-amber-400">$88.47</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Referral Multipliers (10%)</span>
                    <span className="font-bold text-secondary">$29.49</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h4 className="font-bold text-white text-sm mb-3">Top Earning Video</h4>
                <div className="flex items-center gap-3">
                  <img src={MOCK_VIDEOS[2].thumbnail} alt="Top video" className="w-16 h-20 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-sm text-white">{MOCK_VIDEOS[2].title}</p>
                    <p className="text-xs text-emerald-400 font-extrabold mt-1">{MOCK_VIDEOS[2].earnings} generated</p>
                    <p className="text-[11px] text-zinc-500">{MOCK_VIDEOS[2].views} views • 28.3k likes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center relative">
            <button onClick={() => setShowTipModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-3">
              <Gift size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Tip @{creator.username}</h3>
            <p className="text-xs text-zinc-400 mb-5">Support their content with instant tokens</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['1.00', '2.00', '5.00', '10.00', '20.00', '50.00'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedTip(amt)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    selectedTip === amt ? 'bg-primary border-primary text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                setTipSuccess(true);
                setTimeout(() => {
                  setTipSuccess(false);
                  setShowTipModal(false);
                }, 1500);
              }}
              className="w-full py-3 bg-gradient-to-r from-primary to-amber-500 text-white font-bold rounded-xl"
            >
              {tipSuccess ? '✓ Tip Sent!' : `Confirm $${selectedTip} Tip`}
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1 block">Display Name</label>
                <input type="text" defaultValue={creator.displayName} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1 block">Bio</label>
                <textarea rows={3} defaultValue={creator.bio} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm">
                Cancel
              </button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
