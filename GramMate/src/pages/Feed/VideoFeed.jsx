/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Bookmark, Flag, Heart, MessageCircle, Search, Share2, UserPlus, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const feedTabs = ['Recommended', 'Trending', 'Following', 'Search'];

// Parse count values (strings like '124K' or numbers) to integer values
const parseCount = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = val.toString().toLowerCase().trim();
  if (str.endsWith('k')) return parseFloat(str) * 1000;
  if (str.endsWith('m')) return parseFloat(str) * 1000000;
  return parseInt(str, 10) || 0;
};

// Format integer values back to strings like '124K'
const formatCount = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

function EngagementTracker({ isActive, rewardRate }) {
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!isActive) return undefined;
    const interval = setInterval(() => setEarned((prev) => prev + 0.0003), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="absolute left-4 top-4 z-20 rounded-md bg-white px-3 py-2 text-slate-950 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Earning</p>
      <p className="text-sm font-bold">${earned.toFixed(4)} <span className="font-medium text-slate-500">at {rewardRate}</span></p>
    </div>
  );
}

export default function VideoFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [videoList, setVideoList] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(0);
  const [activeTab, setActiveTab] = useState('Recommended');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Engagement states
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [following, setFollowing] = useState({});
  
  // Counts states
  const [likesCounts, setLikesCounts] = useState({});
  const [savesCounts, setSavesCounts] = useState({});
  const [commentsCounts, setCommentsCounts] = useState({});
  const [sharesCounts, setSharesCounts] = useState({});
  
  // Comments Drawer states
  const [commentsVideoId, setCommentsVideoId] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  


  const showToast = (message, type = 'info') => {
    toast[type]?.(message) || toast.info(message);
  };

  const containerRef = useRef(null);

  // Fetch Videos
  useEffect(() => {
    const fetchVideos = async () => {
      setFeedLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select(`
            *,
            profiles:user_id (
              username,
              full_name,
              is_verified,
              avatar_url
            )
          `)
          .eq('is_active', true)
          .eq('visibility', 'public')
          .eq('processing_status', 'ready')
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const dbVideos = (data || []).map(v => ({
          id: v.id,
          url: v.video_url,
          title: v.title,
          creator: v.profiles?.full_name || 'Anonymous Creator',
          handle: v.profiles?.username || 'user',
          category: v.category,
          description: v.description || '',
          likes: v.likes_count || 0,
          comments: v.comments_count || 0,
          shares: v.shares_count || 0,
          saves: v.saves_count || 0,
          rewardRate: `$${v.reward_rate_per_min || '0.01'}/min`,
          duration: v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}:${(v.duration_seconds % 60).toString().padStart(2, '0')}` : '0:30',
          verified: v.profiles?.is_verified || false,
          user_id: v.user_id
        }));

        // Initialize counts
        const initialLikes = {};
        const initialSaves = {};
        const initialComments = {};
        const initialShares = {};

        dbVideos.forEach(vid => {
          initialLikes[vid.id] = vid.likes;
          initialSaves[vid.id] = vid.saves;
          initialComments[vid.id] = vid.comments;
          initialShares[vid.id] = vid.shares;
        });

        setLikesCounts(initialLikes);
        setSavesCounts(initialSaves);
        setCommentsCounts(initialComments);
        setSharesCounts(initialShares);
        
        setVideoList(dbVideos);
      } catch (err) {
        console.error('Error fetching videos:', err.message);
        showToast('Failed to load videos', 'error');
        setVideoList([]);
      } finally {
        setFeedLoading(false);
      }
    };

    fetchVideos();

    const channel = supabase
      .channel('published-videos-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
        fetchVideos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch user interactions if authenticated
  useEffect(() => {
    if (!user) {
      setLiked({});
      setSaved({});
      setFollowing({});
      return;
    }

    const fetchInteractions = async () => {
      try {
        // Fetch Likes
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('video_id')
          .eq('user_id', user.id);
        if (likesError) throw likesError;
        if (likesData) {
          const map = {};
          likesData.forEach(item => map[item.video_id] = true);
          setLiked(map);
        }

        // Fetch Saves
        const { data: savesData, error: savesError } = await supabase
          .from('saved_videos')
          .select('video_id')
          .eq('user_id', user.id);
        if (savesError) throw savesError;
        if (savesData) {
          const map = {};
          savesData.forEach(item => map[item.video_id] = true);
          setSaved(map);
        }

        // Fetch Follows
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (followsError) throw followsError;
        if (followsData) {
          const map = {};
          followsData.forEach(item => map[item.following_id] = true);
          setFollowing(map);
        }
    } catch (err) {
      console.error('Error fetching user interactions:', err);
      showToast('Could not load your interactions', 'error');
    }
    };

    fetchInteractions();
  }, [user]);

  // Video Autoplay & Intersection Observer
  useEffect(() => {
    if (videoList.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveVideo(index);
            
            // Try to play the video element
            const videoElement = entry.target.querySelector('video');
            if (videoElement) {
              videoElement.play().catch(() => {});
            }
          } else {
            // Pause video when out of viewport
            const videoElement = entry.target.querySelector('video');
            if (videoElement) {
              videoElement.pause();
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const videoNodes = document.querySelectorAll('.video-container');
    videoNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [videoList]);

  // Interaction Handlers
  const handleLike = async (video) => {
    if (!user) {
      showToast('Please sign in to like videos', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const isCurrentlyLiked = !!liked[video.id];
    const currentCount = likesCounts[video.id] ?? 0;

    // Optimistic Update
    setLiked(prev => ({ ...prev, [video.id]: !isCurrentlyLiked }));
    setLikesCounts(prev => ({
      ...prev,
      [video.id]: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
    }));

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, video_id: video.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Like error:', err);
      // Revert
      setLiked(prev => ({ ...prev, [video.id]: isCurrentlyLiked }));
      setLikesCounts(prev => ({ ...prev, [video.id]: currentCount }));
      showToast('Failed to update like status', 'error');
    }
  };

  const handleSave = async (video) => {
    if (!user) {
      showToast('Please sign in to save videos', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const isCurrentlySaved = !!saved[video.id];
    const currentCount = savesCounts[video.id] ?? 0;

    // Optimistic Update
    setSaved(prev => ({ ...prev, [video.id]: !isCurrentlySaved }));
    setSavesCounts(prev => ({
      ...prev,
      [video.id]: isCurrentlySaved ? Math.max(0, currentCount - 1) : currentCount + 1
    }));
    showToast(isCurrentlySaved ? 'Removed from bookmarks' : 'Added to bookmarks', 'success');

    try {
      if (isCurrentlySaved) {
        const { error } = await supabase
          .from('saved_videos')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_videos')
          .insert({ user_id: user.id, video_id: video.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Save error:', err);
      // Revert
      setSaved(prev => ({ ...prev, [video.id]: isCurrentlySaved }));
      setSavesCounts(prev => ({ ...prev, [video.id]: currentCount }));
      showToast('Failed to update bookmark status', 'error');
    }
  };

  const handleFollow = async (video) => {
    if (!user) {
      showToast('Please sign in to follow creators', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const targetKey = video.user_id;
    
    if (!targetKey) {
      showToast('Creator details not available', 'error');
      return;
    }

    const isCurrentlyFollowing = !!following[targetKey];

    // Optimistic Update
    setFollowing(prev => ({ ...prev, [targetKey]: !isCurrentlyFollowing }));
    showToast(isCurrentlyFollowing ? `Unfollowed @${video.handle}` : `Followed @${video.handle}`, 'success');

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetKey });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Follow error:', err);
      // Revert
      setFollowing(prev => ({ ...prev, [targetKey]: isCurrentlyFollowing }));
      showToast('Failed to update follow status', 'error');
    }
  };

  const handleShare = (video) => {
    const url = `${window.location.origin}/feed?video=${video.id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('Video link copied to clipboard!', 'success');
        const currentCount = sharesCounts[video.id] ?? 0;
        setSharesCounts(prev => ({
          ...prev,
          [video.id]: currentCount + 1
        }));
      })
      .catch((err) => {
        console.error('Share failed:', err);
        showToast('Failed to copy link', 'error');
      });
  };

  // Comments Handling
  useEffect(() => {
    if (commentsVideoId) {
      const fetchComments = async () => {
        setCommentsLoading(true);
        try {
          const { data, error } = await supabase
            .from('comments')
            .select(`
              id,
              content,
              created_at,
              profiles:user_id (
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('video_id', commentsVideoId)
            .order('created_at', { ascending: true });

          if (error) throw error;

          const formatted = (data || []).map(c => ({
            id: c.id,
            username: c.profiles?.username || 'user',
            fullName: c.profiles?.full_name || 'Anonymous',
            avatarUrl: c.profiles?.avatar_url,
            content: c.content,
            created_at: c.created_at
          }));

          setCommentsList(formatted);
        } catch (err) {
          console.error('Comments load error:', err);
          showToast('Failed to load comments', 'error');
        } finally {
          setCommentsLoading(false);
        }
      };

      fetchComments();
    }
  }, [commentsVideoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    if (!user) {
      showToast('Please sign in to comment', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const videoId = commentsVideoId;
    const commentContent = newCommentText.trim();
    setNewCommentText('');

    const tempCommentId = crypto.randomUUID();
    const optimisticComment = {
      id: tempCommentId,
      username: user.email ? user.email.split('@')[0] : 'me',
      fullName: user.user_metadata?.full_name || 'Me',
      avatarUrl: user.user_metadata?.avatar_url || null,
      content: commentContent,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setCommentsList(prev => [...prev, optimisticComment]);
    setCommentsCounts(prev => ({
      ...prev,
      [videoId]: (prev[videoId] ?? 0) + 1
    }));

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          video_id: videoId,
          content: commentContent,
          moderation_status: 'approved'
        })
        .select(`
          id,
          created_at,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setCommentsList(prev => prev.map(c => c.id === tempCommentId ? {
        id: data.id,
        username: data.profiles?.username || optimisticComment.username,
        fullName: data.profiles?.full_name || optimisticComment.fullName,
        avatarUrl: data.profiles?.avatar_url || optimisticComment.avatarUrl,
        content: commentContent,
        created_at: data.created_at
      } : c));
    } catch (err) {
      console.error('Comment submit error:', err);
      // Revert
      setCommentsList(prev => prev.filter(c => c.id !== tempCommentId));
      setCommentsCounts(prev => ({
        ...prev,
        [videoId]: Math.max(0, (prev[videoId] ?? 0) - 1)
      }));
      setNewCommentText(commentContent);
      showToast('Failed to post comment', 'error');
    }
  };

  // Filter video list based on tab
  const filteredVideos = videoList.filter(video => {
    if (activeTab === 'Trending') return parseCount(likesCounts[video.id]) > 50000;
    if (activeTab === 'Following') {
      const creatorKey = video.user_id;
      return !!following[creatorKey];
    }
    if (activeTab === 'Search') {
      if (!searchQuery) return true;
      return (
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.handle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true; // Recommended
  });

  return (
    <div className="grid h-[calc(100vh-3.5rem)] bg-slate-950 md:h-screen lg:grid-cols-[1fr_360px]">
      <section ref={containerRef} className="relative h-full snap-y snap-mandatory overflow-y-scroll bg-black no-scrollbar" aria-label="Video feed">
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-black/80 p-3 backdrop-blur">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {feedLoading ? (
          <div className="flex h-[80%] flex-col items-center justify-center gap-4 text-slate-300">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--gm-brand)] border-t-transparent" />
            <p className="text-sm font-bold">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex h-[80%] flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Search size={40} className="mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white">No videos available yet</h3>
            <p className="mt-2 text-sm max-w-xs">Be the first to upload a video or adjust your search filter.</p>
          </div>
        ) : (
          filteredVideos.map((video, index) => {
            const isActive = index === activeVideo;
            const creatorKey = video.user_id;
            const isFollowed = !!following[creatorKey];

            return (
              <article
                key={video.id}
                data-index={index}
                className="video-container relative flex h-[calc(100vh-7rem)] snap-start items-center justify-center bg-black md:h-screen"
              >
                {video.url ? (
                  <video
                     className="absolute h-full w-full object-cover"
                     src={video.url}
                     loop
                     muted
                     autoPlay={isActive}
                     playsInline
                     preload={index === 0 ? 'auto' : 'metadata'}
                     aria-label={video.title}
                  />
                ) : (
                  <div className="absolute h-full w-full bg-black flex items-center justify-center text-white">
                    <div className="text-center">
                      <p className="text-sm">No video available</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
                <EngagementTracker isActive={isActive} rewardRate={video.rewardRate} />

                <div className="absolute bottom-6 left-4 z-20 max-w-[72%] text-white md:left-8">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-bold backdrop-blur">{video.category}</span>
                    <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-white">{video.rewardRate}</span>
                  </div>
                  <h2 className="text-2xl font-bold">{video.title}</h2>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <span>@{video.handle}</span>
                    {video.verified && <BadgeCheck size={16} className="text-[var(--gm-accent)]" aria-label="Verified creator" />}
                    {isFollowed && (
                      <span className="text-[10px] bg-[var(--gm-brand)]/80 px-2 py-0.5 rounded-full font-bold">Following</span>
                    )}
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{video.description}</p>
                </div>

                <div className="absolute bottom-8 right-4 z-20 flex flex-col items-center gap-4">
                  {/* Like Button */}
                  <button onClick={() => handleLike(video)} className="group flex flex-col items-center gap-1 text-white animate-fade-in" aria-label="Like video">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-all group-hover:bg-white group-hover:text-slate-950 ${liked[video.id] ? 'text-red-500 scale-110' : ''}`}>
                      <Heart size={23} fill={liked[video.id] ? '#ef4444' : 'none'} className="transition-transform duration-200" />
                    </span>
                    <span className="text-xs font-bold">{formatCount(likesCounts[video.id] ?? 0)}</span>
                  </button>

                  {/* Comment Button */}
                  <button onClick={() => setCommentsVideoId(video.id)} className="group flex flex-col items-center gap-1 text-white" aria-label="Comment">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur group-hover:bg-white group-hover:text-slate-950">
                      <MessageCircle size={22} />
                    </span>
                    <span className="text-xs font-bold">{formatCount(commentsCounts[video.id] ?? 0)}</span>
                  </button>

                  {/* Share Button */}
                  <button onClick={() => handleShare(video)} className="group flex flex-col items-center gap-1 text-white" aria-label="Share">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur group-hover:bg-white group-hover:text-slate-950">
                      <Share2 size={22} />
                    </span>
                    <span className="text-xs font-bold">{formatCount(sharesCounts[video.id] ?? 0)}</span>
                  </button>

                  {/* Save Button */}
                  <button onClick={() => handleSave(video)} className="group flex flex-col items-center gap-1 text-white" aria-label="Save">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-all group-hover:bg-white group-hover:text-slate-950 ${saved[video.id] ? 'text-yellow-500 scale-110' : ''}`}>
                      <Bookmark size={22} fill={saved[video.id] ? '#eab308' : 'none'} className="transition-transform duration-200" />
                    </span>
                    <span className="text-xs font-bold">{formatCount(savesCounts[video.id] ?? 0)}</span>
                  </button>

                  {/* Follow Button */}
                  <button onClick={() => handleFollow(video)} className="group flex flex-col items-center gap-1 text-white" aria-label="Follow creator">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-all group-hover:bg-white group-hover:text-slate-950 ${isFollowed ? 'text-[var(--gm-brand-light)] scale-105' : ''}`}>
                      {isFollowed ? <UserCheck size={22} /> : <UserPlus size={22} />}
                    </span>
                    <span className="text-xs font-bold">{isFollowed ? 'Following' : 'Follow'}</span>
                  </button>

                  {/* Report Button */}
                  <button onClick={() => showToast('Creator reported. We are reviewing this content.', 'info')} className="group flex flex-col items-center gap-1 text-white" aria-label="Report content">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur group-hover:bg-white group-hover:text-slate-950">
                      <Flag size={22} />
                    </span>
                    <span className="text-xs font-bold">Report</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <aside className="hidden border-l border-slate-800 bg-slate-950 p-6 text-white lg:block">
        <label className="relative block">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'Search') setActiveTab('Search');
            }}
            className="w-full rounded-md border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--gm-brand)] focus:ring-1 focus:ring-[var(--gm-brand)]"
            placeholder="Search videos, creators, topics"
          />
        </label>
        <div className="mt-8">
          <h2 className="text-lg font-bold">Feed controls</h2>
          <div className="mt-4 space-y-3">
            {['Reward eligible only', 'Hide reported creators', 'Show long videos', 'Auto-save liked videos'].map((control) => (
              <label key={control} className="flex items-center justify-between rounded-md border border-slate-800 p-3 text-sm font-semibold text-slate-200 cursor-pointer">
                {control}
                <input type="checkbox" className="h-4 w-4 accent-[var(--gm-brand)]" defaultChecked={control !== 'Show long videos'} />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-bold">Reward integrity</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Rewards are calculated from verified watch time, engagement quality, and campaign rules. Suspicious traffic is held before payout.</p>
        </div>
      </aside>

      {/* Slide-out Comments Drawer */}
      <AnimatePresence>
        {commentsVideoId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommentsVideoId(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col border-l border-white/10 bg-slate-950 text-white shadow-2xl md:max-w-[380px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <h3 className="text-lg font-bold">Comments</h3>
                  <p className="text-xs text-slate-400">
                    {formatCount(commentsCounts[commentsVideoId] ?? 0)} comments
                  </p>
                </div>
                <button
                  onClick={() => setCommentsVideoId(null)}
                  className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
                  aria-label="Close comments"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {commentsLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--gm-brand)] border-t-transparent" />
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                    <MessageCircle size={32} className="mb-2 text-slate-600" />
                    <p className="text-sm font-bold text-white">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  commentsList.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-brand)] font-bold text-white uppercase">
                        {comment.fullName ? comment.fullName[0] : (comment.username ? comment.username[0] : 'U')}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">@{comment.username}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-normal">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="border-t border-white/10 p-4 bg-slate-900">
                <div className="flex gap-2">
                  <input
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add comment..."
                    className="flex-1 rounded-md border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--gm-brand)] focus:ring-1 focus:ring-[var(--gm-brand)]"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--gm-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--gm-brand-light)] transition-colors"
                  >
                    Post
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
