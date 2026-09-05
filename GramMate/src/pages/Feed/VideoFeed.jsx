import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  AlertTriangle, 
  Send, 
  X, 
  Trash2,
  Check,
  Video
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchFeedVideos, 
  hasUserLiked, 
  toggleLike, 
  fetchComments, 
  addComment, 
  submitReport,
  deleteVideo 
} from '../../services/supabaseService';
import { VideoFeedSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function VideoFeed({ isDiscoverMode = false }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(true);
  
  // Interaction drawers / modals
  const [activeCommentVideo, setActiveCommentVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Report Modal
  const [reportVideo, setReportVideo] = useState(null);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);

  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeedVideos({ limit: 25 });
      setVideos(data);
    } catch (err) {
      console.error('[VideoFeed] Load error:', err);
      setError('Could not load videos. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Handle Comment Drawer
  const openComments = async (video) => {
    setActiveCommentVideo(video);
    setCommentLoading(true);
    try {
      const list = await fetchComments(video.id);
      setComments(list);
    } catch (err) {
      console.warn('[VideoFeed] Comments error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to comment.');
      navigate('/login');
      return;
    }
    if (!newCommentText.trim() || !activeCommentVideo) return;

    try {
      const inserted = await addComment(activeCommentVideo.id, user.id, newCommentText);
      setComments((prev) => [
        {
          ...inserted,
          author: {
            username: user.username,
            full_name: user.displayName,
            avatar_url: user.photoURL,
          }
        },
        ...prev
      ]);
      setNewCommentText('');
      // Optimistically update comments count in feed
      setVideos((prev) =>
        prev.map((v) => (v.id === activeCommentVideo.id ? { ...v, comments_count: (v.comments_count || 0) + 1 } : v))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to post comment.');
    }
  };

  // Handle Share
  const handleShare = async (video) => {
    const url = `${window.location.origin}/video/${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || 'Check out this video on GramMate!',
          url,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  // Handle Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportVideo) return;
    setReporting(true);
    try {
      await submitReport({
        videoId: reportVideo.id,
        reporterId: user?.id,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success('Report submitted for moderation review.');
      setReportVideo(null);
      setReportDescription('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  // Handle Delete (owner or admin)
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await deleteVideo(videoId, isAdmin ? null : user?.id);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      toast.success('Video removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete video.');
    }
  };

  if (loading) {
    return <VideoFeedSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button onClick={loadFeed} className="gm-btn-secondary text-xs px-4 py-2">
          Try Again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="Be the first creator to upload a video on GramMate and start building your audience."
          actionLabel="Upload First Video"
          onAction={() => navigate('/upload')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto py-6 px-3 md:px-0 space-y-8 pb-24">
      {videos.map((video) => (
        <FeedItem
          key={video.id}
          video={video}
          muted={muted}
          onToggleMute={() => setMuted(!muted)}
          onOpenComments={() => openComments(video)}
          onShare={() => handleShare(video)}
          onReport={() => setReportVideo(video)}
          onDelete={() => handleDeleteVideo(video.id)}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
        />
      ))}

      {/* Comments Sliding Drawer / Modal */}
      <Modal
        isOpen={Boolean(activeCommentVideo)}
        onClose={() => setActiveCommentVideo(null)}
        title="Comments"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-[400px]">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {commentLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-10 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
                <div className="h-10 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-[var(--gm-text-tertiary)] text-center py-10">
                No comments yet. Say something friendly!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  {c.author?.avatar_url ? (
                    <img 
                      src={c.author.avatar_url} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover shrink-0" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--gm-surface-elevated)] flex items-center justify-center shrink-0 font-bold">
                      {c.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-[var(--gm-text)]">
                        {c.author?.full_name || c.author?.username || 'User'}
                      </span>
                      <span className="text-[10px] text-[var(--gm-text-tertiary)]">
                        @{c.author?.username || 'user'}
                      </span>
                    </div>
                    <p className="text-[var(--gm-text-secondary)] leading-relaxed break-words">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handlePostComment} className="pt-3 border-t border-[var(--gm-border)] flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={isAuthenticated ? 'Write a comment...' : 'Sign in to comment...'}
              disabled={!isAuthenticated}
              className="gm-input text-xs flex-1"
            />
            <button
              type="submit"
              disabled={!isAuthenticated || !newCommentText.trim()}
              className="gm-btn-primary p-2 text-xs"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={Boolean(reportVideo)}
        onClose={() => setReportVideo(null)}
        title="Report Content"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <p className="text-[var(--gm-text-secondary)]">
            Our moderation team reviews all flagged videos to maintain community standards.
          </p>

          <div>
            <label className="block font-semibold mb-1">Reason for report</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="gm-input text-xs"
            >
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Harassment or Hate">Harassment or Hate</option>
              <option value="Spam or Misleading">Spam or Misleading</option>
              <option value="Copyright Violation">Copyright Violation</option>
              <option value="Dangerous Activity">Dangerous Activity</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Additional details (optional)</label>
            <textarea
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Provide any relevant context..."
              className="gm-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReportVideo(null)}
              className="gm-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reporting}
              className="gm-btn-primary text-xs bg-red-600 hover:bg-red-700"
            >
              {reporting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FeedItem({ 
  video, 
  muted, 
  onToggleMute, 
  onOpenComments, 
  onShare, 
  onReport, 
  onDelete,
  currentUserId,
  isAdmin,
  isAuthenticated
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count || 0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Check like state
  useEffect(() => {
    let isMounted = true;
    if (currentUserId) {
      hasUserLiked(video.id, currentUserId).then((res) => {
        if (isMounted) setLiked(res);
      });
    }
    return () => { isMounted = false; };
  }, [video.id, currentUserId]);

  // Autoplay on intersection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to like videos.');
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    await toggleLike(video.id, currentUserId, liked);
  };

  const isOwner = currentUserId && currentUserId === video.user_id;

  return (
    <div ref={containerRef} className="gm-card overflow-hidden border border-[var(--gm-border)]">
      {/* Author Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[var(--gm-border)] bg-[var(--gm-surface)]">
        <Link 
          to={`/profile/${video.author?.username || video.user_id}`}
          className="flex items-center gap-2.5 group"
        >
          {video.author?.avatar_url ? (
            <img 
              src={video.author.avatar_url} 
              alt="" 
              className="w-9 h-9 rounded-full object-cover border border-[var(--gm-border)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--gm-surface-elevated)] text-[var(--gm-text)] flex items-center justify-center font-bold text-xs">
              {video.author?.username?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[var(--gm-text)] group-hover:text-[var(--gm-brand)] transition-colors">
                {video.author?.full_name || video.author?.username || 'Creator'}
              </span>
              {video.author?.is_verified && (
                <span className="w-3.5 h-3.5 rounded-full bg-[var(--gm-brand)] text-white text-[9px] flex items-center justify-center font-black">
                  ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--gm-text-tertiary)]">
              @{video.author?.username || 'creator'}
            </p>
          </div>
        </Link>

        {/* Post Actions Menu */}
        <div className="flex items-center gap-1">
          {(isOwner || isAdmin) && (
            <button
              onClick={onDelete}
              className="p-1.5 text-[var(--gm-text-tertiary)] hover:text-red-400 rounded-md transition-colors"
              title="Delete video"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onReport}
            className="p-1.5 text-[var(--gm-text-tertiary)] hover:text-amber-400 rounded-md transition-colors"
            title="Report content"
          >
            <AlertTriangle size={16} />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-[9/16] max-h-[580px] bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url}
          loop
          muted={muted}
          playsInline
          onClick={handleVideoClick}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Play/Pause Overlay Indicator */}
        {!isPlaying && (
          <div 
            onClick={handleVideoClick}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer pointer-events-auto"
          >
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
              <Play size={24} className="ml-1" />
            </div>
          </div>
        )}

        {/* Volume Toggle */}
        <button
          onClick={onToggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-xs text-white hover:bg-black/80 transition-colors z-20"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Interactive Action Bar */}
      <div className="p-3.5 bg-[var(--gm-surface)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLikeToggle}
              className="flex items-center gap-1.5 text-xs font-semibold group transition-colors"
            >
              <Heart
                size={19}
                className={liked ? 'fill-red-500 text-red-500' : 'text-[var(--gm-text-secondary)] group-hover:text-red-400'}
              />
              <span className={liked ? 'text-red-500 font-bold' : 'text-[var(--gm-text-secondary)]'}>
                {likesCount}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={onOpenComments}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] group transition-colors"
            >
              <MessageCircle size={19} className="group-hover:text-[var(--gm-brand)]" />
              <span>{video.comments_count || 0}</span>
            </button>

            {/* Share */}
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] group transition-colors"
              title="Share video"
            >
              <Share2 size={18} className="group-hover:text-[var(--gm-brand)]" />
              <span>Share</span>
            </button>
          </div>

          {video.category && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--gm-surface-elevated)] text-[var(--gm-text-secondary)] border border-[var(--gm-border)] font-medium">
              {video.category}
            </span>
          )}
        </div>

        {/* Video Title & Description */}
        <div>
          <h3 className="text-sm font-bold text-[var(--gm-text)] mb-1">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-xs text-[var(--gm-text-secondary)] line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
