import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Settings, 
  Camera, 
  Play, 
  Heart, 
  MessageCircle, 
  Video, 
  Check, 
  Share2,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchProfileById, 
  fetchProfileByUsername, 
  fetchUserVideos, 
  updateProfile, 
  uploadAvatar 
} from '../../services/supabaseService';
import { ProfileSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function CreatorProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, refreshProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const isOwner = currentUser?.id && profile?.id && currentUser.id === profile.id;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      let targetProfile = null;
      if (userId) {
        // Try fetching by username first, then by ID
        targetProfile = await fetchProfileByUsername(userId);
        if (!targetProfile) {
          targetProfile = await fetchProfileById(userId);
        }
      } else if (currentUser?.id) {
        targetProfile = await fetchProfileById(currentUser.id);
        if (!targetProfile && currentUser.profile) {
          targetProfile = currentUser.profile;
        }
      }

      if (targetProfile) {
        setProfile(targetProfile);
        setEditName(targetProfile.full_name || targetProfile.display_name || '');
        setEditBio(targetProfile.bio || '');
        // Fetch creator's videos
        const creatorVideos = await fetchUserVideos(targetProfile.id);
        setVideos(creatorVideos);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[CreatorProfilePage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);

    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, profile.id);
      }

      const updated = await updateProfile(profile.id, {
        full_name: editName.trim(),
        display_name: editName.trim(),
        bio: editBio.trim(),
        avatar_url: avatarUrl,
      });

      setProfile(updated);
      await refreshProfile();
      toast.success('Profile updated.');
      setEditModalOpen(false);
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard!');
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <EmptyState
          icon={Video}
          title="User not found"
          description="The creator profile you are looking for does not exist or has been removed."
          actionLabel="Back to Feed"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 pb-24">
      {/* Profile Header Card */}
      <div className="gm-card p-6 md:p-8 mb-8 border border-[var(--gm-border)]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--gm-border-strong)] shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--gm-surface-elevated)] border-2 border-[var(--gm-border)] text-[var(--gm-brand)] flex items-center justify-center font-black text-2xl">
                {profile.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-[var(--gm-text)] tracking-tight">
                {profile.full_name || profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <span className="w-4 h-4 rounded-full bg-[var(--gm-brand)] text-white text-[10px] flex items-center justify-center font-black">
                  ✓
                </span>
              )}
              {profile.role === 'admin' && (
                <span className="gm-badge gm-badge-warning text-[10px]">
                  Administrator
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-[var(--gm-text-tertiary)] mb-3">
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed mb-4 max-w-xl">
                {profile.bio}
              </p>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-6 text-xs text-[var(--gm-text-secondary)]">
              <div>
                <span className="font-bold text-[var(--gm-text)]">{videos.length}</span>{' '}
                <span>Videos</span>
              </div>
              <div>
                <span className="font-bold text-[var(--gm-text)]">{profile.followers_count || 0}</span>{' '}
                <span>Followers</span>
              </div>
              <div>
                <span className="font-bold text-[var(--gm-text)]">{profile.following_count || 0}</span>{' '}
                <span>Following</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 pt-2 md:pt-0">
            {isOwner ? (
              <button
                onClick={() => setEditModalOpen(true)}
                className="gm-btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 flex-1 md:flex-initial justify-center"
              >
                <Settings size={14} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className="gm-btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 flex-1 md:flex-initial justify-center"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
          <h2 className="text-sm font-bold text-[var(--gm-text)] flex items-center gap-2">
            <Video size={16} className="text-[var(--gm-brand)]" />
            <span>Published Videos</span>
          </h2>
          <span className="text-xs text-[var(--gm-text-tertiary)]">
            {videos.length} total
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Video}
              title="No videos posted yet"
              description={isOwner ? "Share your first creation with the world." : "This creator hasn't published any videos yet."}
              actionLabel={isOwner ? "Upload Video" : null}
              onAction={isOwner ? () => window.location.assign('/upload') : null}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videos.map((vid) => (
              <div 
                key={vid.id}
                className="gm-card group relative aspect-[9/16] overflow-hidden bg-black border border-[var(--gm-border)]"
              >
                <video
                  src={vid.video_url}
                  poster={vid.thumbnail_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <p className="text-[11px] font-bold text-white line-clamp-1 mb-1">
                    {vid.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-white/80">
                    <span className="flex items-center gap-1">
                      <Heart size={10} className="fill-white/80" />
                      {vid.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={10} />
                      {vid.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Avatar Upload */}
          <div>
            <label className="block font-semibold mb-1.5">Profile Photo</label>
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-[var(--gm-border)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--gm-surface-elevated)] flex items-center justify-center font-bold">
                  {profile.username?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="text-xs text-[var(--gm-text-secondary)] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--gm-surface-elevated)] file:text-[var(--gm-text)] hover:file:bg-[var(--gm-border)] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1.5">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="gm-input text-xs"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              className="gm-input text-xs resize-none"
              maxLength={240}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--gm-border)]">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="gm-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="gm-btn-primary text-xs"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
