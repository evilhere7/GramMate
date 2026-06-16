import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, Edit3, Globe, Heart, Loader2, MessageCircle, Play, UploadCloud, UserPlus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import useProfile from '../../hooks/useProfile';

const tabs = ['Videos', 'Liked', 'Saved'];

async function uploadProfileAsset({ file, userId, type }) {
  if (!file) return null;
  const extension = file.name.split('.').pop() || 'jpg';
  const path = type === 'banner' ? `banners/${userId}/banner.jpg` : `public/${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });

  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

function ProfileSkeleton() {
  return (
    <div className="pb-24 md:pb-8">
      <div className="h-48 animate-pulse bg-slate-200 sm:h-64" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-white bg-slate-300" />
        <div className="mt-6 h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ open, onClose, profile, user, onSaved }) {
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    website: '',
    avatar_url: '',
    banner_url: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const { updateProfile } = useProfile();

  useEffect(() => {
    if (!profile || !open) return;
    setForm({
      display_name: profile.display_name || profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      website: profile.website || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || profile.cover_url || '',
    });
    setAvatarFile(null);
    setBannerFile(null);
    setAvatarPreview(null);
    setBannerPreview(null);
    setErrors({});
  }, [profile, open]);

  useEffect(() => {
    if (!open || !form.username || form.username === profile?.username) {
      setUsernameAvailable(true);
      return undefined;
    }

    const handle = setTimeout(async () => {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', form.username)
        .neq('id', user.id)
        .maybeSingle();

      if (error) {
        setErrors((prev) => ({ ...prev, username: 'Could not check username right now.' }));
      } else {
        setUsernameAvailable(!data);
      }
      setCheckingUsername(false);
    }, 450);

    return () => clearTimeout(handle);
  }, [form.username, open, profile?.username, user.id]);

  if (!open) return null;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAssetChange = (event, type) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, [type]: 'Choose an image file.' }));
      return;
    }

    const preview = URL.createObjectURL(selected);
    if (type === 'avatar') {
      setAvatarFile(selected);
      setAvatarPreview(preview);
    } else {
      setBannerFile(selected);
      setBannerPreview(preview);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.display_name.trim()) nextErrors.display_name = 'Display name is required.';
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) nextErrors.username = 'Use 3-30 letters, numbers, or underscores.';
    if (!usernameAvailable) nextErrors.username = 'That username is already taken.';
    if (form.bio.length > 160) nextErrors.bio = 'Bio must be 160 characters or less.';
    if (form.website && !/^https?:\/\/.+\..+/.test(form.website)) nextErrors.website = 'Enter a valid URL starting with http:// or https://.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const [avatarUrl, bannerUrl] = await Promise.all([
        avatarFile ? uploadProfileAsset({ file: avatarFile, userId: user.id, type: 'avatar' }) : Promise.resolve(form.avatar_url),
        bannerFile ? uploadProfileAsset({ file: bannerFile, userId: user.id, type: 'banner' }) : Promise.resolve(form.banner_url),
      ]);

      const saved = await updateProfile({
        ...form,
        username: form.username.trim(),
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });

      toast.success('Profile saved.');
      onSaved(saved);
      onClose();
    } catch (saveError) {
      toast.error(saveError.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form onSubmit={handleSave} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-xl font-bold text-slate-950">Edit profile</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 active:bg-slate-200" aria-label="Close edit profile">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <label className="group relative block aspect-[16/3] min-h-28 cursor-pointer overflow-hidden rounded-lg bg-slate-200">
            {(bannerPreview || form.banner_url) ? (
              <img src={bannerPreview || form.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-500" />
            )}
            <input type="file" accept="image/*" onChange={(event) => handleAssetChange(event, 'banner')} className="sr-only" />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white transition group-hover:bg-slate-950/35">
              <span className="inline-flex items-center gap-2 rounded-md bg-black/45 px-3 py-2 text-sm font-bold opacity-0 transition group-hover:opacity-100"><Edit3 size={16} /> Change banner</span>
            </span>
          </label>

          <label className="group relative -mt-12 ml-4 flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
            {(avatarPreview || form.avatar_url) ? (
              <img src={avatarPreview || form.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="text-slate-400" size={28} />
            )}
            <input type="file" accept="image/*" onChange={(event) => handleAssetChange(event, 'avatar')} className="sr-only" />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white transition group-hover:bg-slate-950/45">
              <Camera size={22} className="opacity-0 transition group-hover:opacity-100" />
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Display name</span>
              <input value={form.display_name} onChange={(e) => setField('display_name', e.target.value)} className={`w-full rounded-md border px-3 py-3 ${errors.display_name ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
              {errors.display_name && <span className="mt-2 block text-sm font-semibold text-red-600">{errors.display_name}</span>}
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
              <div className="relative">
                <input value={form.username} onChange={(e) => setField('username', e.target.value)} className={`w-full rounded-md border px-3 py-3 pr-10 ${errors.username || !usernameAvailable ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
                {checkingUsername ? <Loader2 className="absolute right-3 top-3.5 animate-spin text-slate-400" size={18} /> : usernameAvailable && form.username ? <Check className="absolute right-3 top-3.5 text-green-600" size={18} /> : null}
              </div>
              {(errors.username || !usernameAvailable) && <span className="mt-2 block text-sm font-semibold text-red-600">{errors.username || 'That username is already taken.'}</span>}
            </label>
          </div>

          <label>
            <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              Bio <span className={form.bio.length > 160 ? 'text-red-600' : 'text-slate-400'}>{form.bio.length}/160</span>
            </span>
            <textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} rows={4} className={`w-full resize-none rounded-md border px-3 py-3 ${errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
            {errors.bio && <span className="mt-2 block text-sm font-semibold text-red-600">{errors.bio}</span>}
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Website URL</span>
            <input value={form.website} onChange={(e) => setField('website', e.target.value)} className={`w-full rounded-md border px-3 py-3 ${errors.website ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} placeholder="https://example.com" />
            {errors.website && <span className="mt-2 block text-sm font-semibold text-red-600">{errors.website}</span>}
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white p-5">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving || checkingUsername} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreatorProfilePage() {
  const { user } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Videos');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user) return;
      setVideosLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .or(`creator_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Could not load profile videos.');
        setCreatorVideos([]);
      } else {
        setCreatorVideos(data || []);
      }
      setVideosLoading(false);
    };

    fetchVideos();
  }, [user]);

  const stats = useMemo(() => ({
    followers: new Intl.NumberFormat('en', { notation: 'compact' }).format(profile?.followers_count || 0),
    following: new Intl.NumberFormat('en', { notation: 'compact' }).format(profile?.following_count || 0),
    likes: new Intl.NumberFormat('en', { notation: 'compact' }).format(creatorVideos.reduce((sum, video) => sum + (video.likes_count || 0), 0)),
  }), [creatorVideos, profile]);

  if (loading) return <ProfileSkeleton />;

  const banner = profile?.banner_url || profile?.cover_url;
  const ownProfile = Boolean(user && profile?.id === user.id);

  return (
    <div className="pb-24 md:pb-8">
      <div className="relative h-48 bg-slate-900 sm:h-64">
        {banner ? (
          <img src={banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-slate-950 via-blue-700 to-emerald-500" />
        )}
        {ownProfile && (
          <button onClick={() => setEditOpen(true)} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-white active:bg-slate-100">
            <Edit3 size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="relative pb-6">
          <button onClick={() => ownProfile && setEditOpen(true)} className="group -mt-14 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm sm:-mt-16 sm:h-32 sm:w-32" aria-label="Change avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={`${profile.display_name} avatar`} className="h-full w-full object-cover" /> : <Camera size={34} className="text-slate-400" />}
            {ownProfile && <span className="absolute flex h-28 w-28 items-center justify-center rounded-full bg-slate-950/0 text-white transition group-hover:bg-slate-950/40 sm:h-32 sm:w-32"><Camera size={24} className="opacity-0 transition group-hover:opacity-100" /></span>}
          </button>

          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">{profile?.display_name || 'GramMate Creator'}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">@{profile?.username}</p>
              {profile?.bio && <p className="mt-4 max-w-2xl leading-7 text-slate-700">{profile.bio}</p>}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  <Globe size={16} /> {profile.website}
                </a>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span>{stats.followers} followers</span>
                <span>{stats.following} following</span>
                <span>{stats.likes} likes</span>
              </div>
            </div>

            {!ownProfile && (
              <div className="flex gap-2">
                <button onClick={() => toast.success(`Followed @${profile?.username}`)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"><UserPlus size={18} /> Follow</button>
                <button onClick={() => toast.info('Messaging is coming soon.')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"><MessageCircle size={18} /> Message</button>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-slate-200">
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-4 py-2 text-sm font-bold transition ${activeTab === tab ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Videos' && (
            videosLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="aspect-video animate-pulse rounded-lg bg-slate-200" />)}
              </div>
            ) : creatorVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                <UploadCloud size={38} className="mb-3 text-slate-400" />
                <p className="text-lg font-bold text-slate-950">No videos yet. Upload your first video!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creatorVideos.map((video) => (
                  <article key={video.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-sm">
                    <div className="relative aspect-video bg-slate-950">
                      {video.thumbnail_url || video.video_url ? (
                        <video src={video.video_url} poster={video.thumbnail_url} className="h-full w-full object-cover" muted preload="metadata" />
                      ) : null}
                      <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white">{video.status || video.visibility || 'draft'}</span>
                      <Play className="absolute bottom-3 right-3 text-white" size={22} />
                    </div>
                    <div className="p-4">
                      <h2 className="font-bold text-slate-950">{video.title}</h2>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500"><Heart size={15} /> {video.likes_count || 0} likes</p>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}

          {activeTab !== 'Videos' && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              <p className="text-lg font-bold text-slate-950">Nothing here yet</p>
              <p className="mt-1 text-sm">{activeTab} videos will appear here when you add them.</p>
            </div>
          )}
        </section>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} user={user} onSaved={() => refetch()} />
    </div>
  );
}
