import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  DollarSign, 
  Volume2, 
  VolumeX, 
  Play, 
  Gift, 
  Check, 
  Send, 
  X, 
  Sparkles, 
  Music2, 
  UserPlus, 
  UserCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DUMMY_VIDEOS = [
  {
    id: '1',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    author: 'alex_creator',
    authorName: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: 'Capturing the golden hour vibes in Tokyo! 🌅 Which shot is your favorite? #Tokyo #Cinematic #WatchToEarn',
    songTitle: 'Lost in Shibuya - Synthwave Beats',
    likesCount: 14200,
    commentsCount: 384,
    sharesCount: 1200,
    rewardRate: 0.04, // $0.04 per min
    isVerified: true,
    tags: ['#Tokyo', '#Cinematic', '#WatchToEarn', '#GramMate']
  },
  {
    id: '2',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    author: 'tech_visionary',
    authorName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'AI tools you need in 2026 to automate your entire workflow 🚀 Let me know in the comments!',
    songTitle: 'Futuristic AI Horizon - TechSound',
    likesCount: 28500,
    commentsCount: 1240,
    sharesCount: 4500,
    rewardRate: 0.06,
    isVerified: true,
    tags: ['#AI', '#Productivity', '#FutureTech']
  },
  {
    id: '3',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    author: 'beat_master',
    authorName: 'Marcus Cole',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    description: 'Dropping a fresh beat live in the studio! 🎧 Turn up the bass and feel the groove! #GramMateVibes',
    songTitle: 'Original Audio - Marcus Cole',
    likesCount: 9300,
    commentsCount: 215,
    sharesCount: 890,
    rewardRate: 0.035,
    isVerified: false,
    tags: ['#Music', '#Beats', '#StudioLive']
  }
];

// Floating Watch-To-Earn Real-time Counter
const WatchToEarnBadge = ({ rewardRate, isActive }) => {
  const [earned, setEarned] = useState(0.0025);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setEarned(prev => {
          const increment = rewardRate / 60;
          return prev + increment;
        });
        setPulseKey(p => p + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, rewardRate]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-5 left-4 md:left-6 z-30 flex items-center gap-2.5 bg-black/60 backdrop-blur-xl border border-primary/40 px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,46,99,0.35)]"
    >
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-rose-400 text-white shadow-sm">
        <DollarSign size={14} className="stroke-[3]" />
        <motion.span 
          key={pulseKey}
          initial={{ scale: 1.4, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-full bg-primary"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">EARNING LIVE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-sm font-extrabold text-white tracking-tight leading-none">
          +${earned.toFixed(4)}
        </span>
      </div>
    </motion.div>
  );
};

// Comments Modal Drawer
const CommentsDrawer = ({ isOpen, onClose, videoId, commentsCount }) => {
  const [comments, setComments] = useState([
    { id: 1, user: 'cyber_voyager', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', text: 'This visual quality is unmatched! Keep creating 🔥', time: '2m ago', likes: 18 },
    { id: 2, user: 'sarah_creator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'The watch-to-earn feature on GramMate is revolutionary!', time: '12m ago', likes: 45 },
    { id: 3, user: 'dev_guru', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', text: 'Where did you get that sound track? Added to my favorites!', time: '1h ago', likes: 7 },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now(),
        user: 'you (creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        text: newComment,
        time: 'Just now',
        likes: 0
      },
      ...comments
    ]);
    setNewComment('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end items-end md:items-center md:justify-center p-0 md:p-4"
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full md:max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl md:rounded-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle size={18} className="text-primary" />
              <span>Comments ({comments.length})</span>
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 group">
                <img src={c.avatar} alt={c.user} className="w-8 h-8 rounded-full object-cover border border-zinc-700 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">@{c.user}</span>
                    <span className="text-[11px] text-zinc-500">{c.time}</span>
                  </div>
                  <p className="text-sm text-zinc-200 mt-0.5 leading-snug">{c.text}</p>
                </div>
                <button className="flex flex-col items-center gap-0.5 text-zinc-500 hover:text-primary transition-colors mt-1">
                  <Heart size={14} />
                  <span className="text-[10px]">{c.likes}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-zinc-800 flex items-center gap-2">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment on GramMate..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-500"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="p-2.5 bg-primary disabled:opacity-40 hover:bg-primary/90 text-white rounded-full transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Creator Tipping Modal
const TipModal = ({ isOpen, onClose, creatorName }) => {
  const [selectedAmount, setSelectedAmount] = useState('1.00');
  const [customAmount, setCustomAmount] = useState('');
  const [tipped, setTipped] = useState(false);

  const amounts = ['0.50', '1.00', '2.00', '5.00', '10.00'];

  const handleTip = () => {
    setTipped(true);
    setTimeout(() => {
      setTipped(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none" />
          
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X size={18} />
          </button>

          {tipped ? (
            <div className="py-8 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40"
              >
                <Check size={32} className="stroke-[3]" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-1">Tip Sent!</h3>
              <p className="text-sm text-zinc-400">You supported @{creatorName} with ${customAmount || selectedAmount} USDC</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 text-primary mx-auto flex items-center justify-center mb-4 border border-primary/30">
                <Gift size={28} />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Tip @{creatorName}</h3>
              <p className="text-xs text-zinc-400 mb-6">Send instant crypto or fiat reward to support their creations.</p>

              {/* Amount Pills */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {amounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative mb-6">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                <input 
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(''); }}
                  placeholder="Custom amount"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                onClick={handleTip}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-500/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                <span>Send Tip (${customAmount || selectedAmount})</span>
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function VideoFeed({ isDiscoverMode = false }) {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState({ 1: 14200, 2: 28500, 3: 9300 });
  const [likedMap, setLikedMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [activeCreator, setActiveCreator] = useState('alex_creator');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const videoRefs = useRef([]);

  const currentVideo = DUMMY_VIDEOS[activeVideo] || DUMMY_VIDEOS[0];

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const togglePlay = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleLike = (id) => {
    const isLiked = likedMap[id];
    setLikedMap(prev => ({ ...prev, [id]: !isLiked }));
    setLikes(prev => ({
      ...prev,
      [id]: isLiked ? prev[id] - 1 : prev[id] + 1
    }));
  };

  const toggleFollow = (author) => {
    const isFollowing = followingMap[author];
    setFollowingMap(prev => ({ ...prev, [author]: !isFollowing }));
    triggerToast(isFollowing ? `Unfollowed @${author}` : `Now following @${author}!`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    triggerToast('Link copied to clipboard! 🔗');
  };

  // Intersection Observer for seamless auto-play on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveVideo(index);
            setIsPlaying(true);
            videoRefs.current.forEach((vid, i) => {
              if (vid) {
                if (i === index) {
                  vid.currentTime = 0;
                  vid.play().catch(() => {});
                } else {
                  vid.pause();
                }
              }
            });
          }
        });
      },
      { threshold: 0.6 }
    );

    const nodes = document.querySelectorAll('.video-card-container');
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full bg-black flex justify-center items-center overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 z-50 bg-zinc-900/90 border border-zinc-700 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-2xl flex items-center gap-2"
          >
            <Sparkles size={16} className="text-primary" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Feed Scroller */}
      <div className="h-full w-full max-w-lg snap-y snap-mandatory overflow-y-scroll no-scrollbar relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-zinc-900">
        {DUMMY_VIDEOS.map((video, index) => {
          const isActive = index === activeVideo;
          const isLiked = likedMap[video.id];
          const isFollowing = followingMap[video.author];

          return (
            <div 
              key={video.id} 
              data-index={index}
              className="video-card-container relative h-[calc(100vh-64px)] md:h-screen w-full snap-center bg-zinc-950 flex justify-center items-center select-none"
            >
              {/* Video Player */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                className="absolute inset-0 h-full w-full object-cover cursor-pointer"
                src={video.url}
                loop
                muted={isMuted}
                playsInline
                onClick={() => togglePlay(index)}
              />

              {/* Top Bar Floating Earning Badge */}
              <WatchToEarnBadge rewardRate={video.rewardRate} isActive={isActive && isPlaying} />

              {/* Volume / Sound Toggle HUD */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute top-5 right-4 md:right-6 z-30 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-transform active:scale-90"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-secondary" />}
              </button>

              {/* Play / Pause indicator overlay on tap */}
              <AnimatePresence>
                {!isPlaying && isActive && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.9 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute z-20 pointer-events-none p-5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white"
                  >
                    <Play size={36} className="fill-white translate-x-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gradient Vignettes */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

              {/* Bottom Video Metadata & Author */}
              <div className="absolute bottom-6 left-4 md:left-6 right-20 z-20">
                {/* Author Info */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Link to={`/profile/${video.author}`} className="relative group">
                    <img 
                      src={video.avatar} 
                      alt={video.author} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary group-hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/profile/${video.author}`} className="text-white font-bold text-sm hover:underline">
                        @{video.author}
                      </Link>
                      {video.isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-secondary text-black text-[9px] font-bold flex items-center justify-center">✓</span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">{video.authorName}</span>
                  </div>
                  
                  <button
                    onClick={() => toggleFollow(video.author)}
                    className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      isFollowing 
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                        : 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/30'
                    }`}
                  >
                    {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                </div>

                {/* Caption / Description */}
                <p className="text-zinc-100 text-sm font-normal mb-3 line-clamp-2 leading-relaxed drop-shadow">
                  {video.description}
                </p>

                {/* Audio Track Marquee */}
                <div className="flex items-center gap-2 text-zinc-300 text-xs">
                  <Music2 size={13} className="text-secondary animate-pulse" />
                  <span className="truncate max-w-[200px]">{video.songTitle}</span>
                </div>
              </div>

              {/* Right Interactive Actions Sidebar */}
              <div className="absolute right-3 md:right-4 bottom-6 z-20 flex flex-col items-center gap-4">
                {/* Like Button */}
                <button 
                  onClick={() => toggleLike(video.id)}
                  className="group flex flex-col items-center gap-1"
                >
                  <motion.div 
                    whileTap={{ scale: 1.3 }}
                    className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                      isLiked 
                        ? 'bg-primary/20 border-primary/50 text-primary' 
                        : 'bg-black/50 border-white/10 text-white group-hover:border-white/30'
                    }`}
                  >
                    <Heart size={24} className={isLiked ? 'fill-primary text-primary' : 'text-white'} />
                  </motion.div>
                  <span className="text-white text-xs font-bold drop-shadow-md">
                    {(likes[video.id] || video.likesCount).toLocaleString()}
                  </span>
                </button>

                {/* Comment Button */}
                <button 
                  onClick={() => setCommentDrawerOpen(true)}
                  className="group flex flex-col items-center gap-1"
                >
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white group-hover:border-white/30 transition-all"
                  >
                    <MessageCircle size={24} />
                  </motion.div>
                  <span className="text-white text-xs font-bold drop-shadow-md">
                    {video.commentsCount}
                  </span>
                </button>

                {/* Tip Creator Button */}
                <button 
                  onClick={() => {
                    setActiveCreator(video.author);
                    setTipModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-1"
                >
                  <motion.div 
                    whileTap={{ scale: 1.2 }}
                    className="p-3 rounded-full bg-gradient-to-tr from-primary/30 to-amber-500/30 backdrop-blur-md border border-primary/40 text-amber-300 group-hover:shadow-[0_0_15px_rgba(255,46,99,0.4)] transition-all"
                  >
                    <Gift size={24} className="animate-bounce" />
                  </motion.div>
                  <span className="text-amber-300 text-xs font-bold drop-shadow-md">
                    Tip
                  </span>
                </button>

                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="group flex flex-col items-center gap-1"
                >
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white group-hover:border-white/30 transition-all"
                  >
                    <Share2 size={24} />
                  </motion.div>
                  <span className="text-white text-xs font-bold drop-shadow-md">
                    {video.sharesCount}
                  </span>
                </button>

                {/* Spinning Audio Record */}
                <div className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center mt-2 animate-spin [animation-duration:6s]">
                  <img src={video.avatar} alt="sound" className="w-6 h-6 rounded-full object-cover" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CommentsDrawer 
        isOpen={commentDrawerOpen}
        onClose={() => setCommentDrawerOpen(false)}
        videoId={currentVideo.id}
        commentsCount={currentVideo.commentsCount}
      />

      <TipModal 
        isOpen={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
        creatorName={activeCreator}
      />
    </div>
  );
}
