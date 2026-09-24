import { supabase } from '../lib/supabase';
import {
  fetchWalletSummary,
  fetchWalletLedger,
  submitWithdrawalRequest,
} from './economyService';

// ─── Profile Services ───

export async function fetchProfileById(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabaseService] fetchProfileById error:', err?.message || err);
    return null;
  }
}

export async function fetchProfileByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabaseService] fetchProfileByUsername error:', err?.message || err);
    return null;
  }
}

export async function updateProfile(id, updates) {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[supabaseService] updateProfile error:', err?.message || err);
    throw err;
  }
}

export async function uploadAvatar(file, userId) {
  if (!file) throw new Error('No file provided');
  const bucket = 'avatars';
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadErr) {
    console.warn('[supabaseService] Storage upload failed:', uploadErr.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const avatarUrl = urlData?.publicUrl || '';

  // Update profile record
  if (avatarUrl) {
    await updateProfile(userId, { avatar_url: avatarUrl }).catch(() => {});
  }

  return avatarUrl;
}

// ─── Video & Feed Services ───

export async function fetchFeedVideos({ limit = 20, offset = 0, category = null } = {}) {
  try {
    const feedColumns = `
        id,
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        category,
        tags,
        duration_seconds,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        created_at
      `;
    const legacyFeedColumns = `
        id,
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        created_at
      `;

    let query = supabase
      .from('videos')
      .select(feedColumns)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    let { data: videos, error } = await query;
    if (error && /column .* does not exist|schema cache/i.test(error.message || '')) {
      const legacyQuery = supabase
        .from('videos')
        .select(legacyFeedColumns)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      const legacyResult = await legacyQuery;
      videos = (legacyResult.data || []).map((video) => ({
        ...video,
        category: 'General',
        tags: [],
        duration_seconds: null,
      }));
      if (category && category !== 'all') {
        videos = videos.filter((video) => video.category === category);
      }
      error = legacyResult.error;
    }
    if (error) throw error;

    if (!videos || videos.length === 0) {
      return [];
    }

    // Enrich videos with author profiles
    const userIds = [...new Set(videos.map(v => v.user_id).filter(Boolean))];
    let profilesMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    return videos.map(video => ({
      ...video,
      author: profilesMap[video.user_id] || {
        username: 'creator',
        full_name: 'GramMate Creator',
        avatar_url: null,
        is_verified: false,
      }
    }));
  } catch (err) {
    console.error('[supabaseService] fetchFeedVideos error:', err?.message || err);
    return [];
  }
}

export async function fetchUserVideos(userId) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[supabaseService] fetchUserVideos error:', err?.message || err);
    return [];
  }
}

export async function extractVideoThumbnail(file, seekTimeSeconds = 0.5) {
  if (typeof window === 'undefined' || !window.document) return null;
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute('src');
        video.load();
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);

      video.onloadeddata = () => {
        video.currentTime = Math.min(seekTimeSeconds, Math.max(0, (video.duration || 1) / 2));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 720);
          canvas.height = Math.round(canvas.width * ((video.videoHeight || 360) / (video.videoWidth || 640)));
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              clearTimeout(timer);
              cleanup();
              resolve(blob);
            }, 'image/jpeg', 0.82);
            return;
          }
        } catch {
          // Canvas capture failure (cross-origin / codec limitation)
        }
        clearTimeout(timer);
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function uploadVideo(
  file,
  userId,
  { title, description, category, tags = [], onProgress, onStatus } = {}
) {
  if (!file) throw new Error('No video file provided.');
  if (!userId) throw new Error('You must be signed in to upload a video.');

  const reportStatus = (text) => {
    if (typeof onStatus === 'function') onStatus(text);
  };
  const reportProgress = (pct) => {
    if (typeof onProgress === 'function') onProgress(pct);
  };

  reportStatus('Validating video file...');
  reportProgress(10);

  const fileName = (file.name || 'video.mp4').toLowerCase();
  const fileExt = fileName.split('.').pop() || 'mp4';
  const allowedExtensions = ['mp4', 'webm', 'mov', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg'];
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/mpeg',
    'video/ogg',
    'video/x-m4v',
  ];

  const hasValidType = file.type && (file.type.startsWith('video/') || allowedTypes.includes(file.type));
  const hasValidExt = allowedExtensions.includes(fileExt);

  if (!hasValidType && !hasValidExt) {
    throw new Error('Please choose a supported video file (MP4, WebM, MOV, or MKV).');
  }

  if (file.size <= 0) {
    throw new Error('The selected video file is empty. Please choose a valid video.');
  }

  // 500MB platform limit
  if (file.size > 500 * 1024 * 1024) {
    throw new Error('Video file size exceeds the 500MB limit. Please choose a smaller file.');
  }

  const bucket = 'videos';
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const videoFilePath = `${userId}/${uniqueId}.${fileExt}`;

  // 1. Generate video thumbnail non-blockingly
  reportStatus('Generating video poster preview...');
  reportProgress(25);
  let thumbnailUrl = null;
  try {
    const thumbBlob = await extractVideoThumbnail(file, 0.5);
    if (thumbBlob) {
      const thumbPath = `${userId}/${uniqueId}_thumb.jpg`;
      const { error: thumbErr } = await supabase.storage
        .from(bucket)
        .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });

      if (!thumbErr) {
        const { data: thumbUrlData } = supabase.storage.from(bucket).getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData?.publicUrl || null;
      }
    }
  } catch (thumbEx) {
    console.warn('[supabaseService] Thumbnail capture skipped/fallback:', thumbEx?.message || thumbEx);
  }

  // 2. Upload video file directly to Supabase Storage
  reportStatus('Uploading video to storage...');
  reportProgress(50);

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(videoFilePath, file, {
      contentType: file.type || `video/${fileExt}`,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadErr) {
    console.error('[supabaseService] Supabase video storage upload error:', uploadErr);
    const msg = (uploadErr.message || '').toLowerCase();

    if (msg.includes('bucket not found') || msg.includes('does not exist') || uploadErr.statusCode === '404') {
      throw new Error(
        `Storage bucket '${bucket}' was not found. Please ensure the 'videos' bucket exists in Supabase Storage with public read access (run supabase/storage_setup.sql in the Supabase SQL Editor).`
      );
    }
    if (msg.includes('row-level security') || msg.includes('policy') || uploadErr.statusCode === '403') {
      throw new Error(
        'Upload permission error: Supabase storage policy prevented saving the video. Ensure the videos bucket insert policy allows authenticated creators to upload (run supabase/storage_setup.sql).'
      );
    }
    throw new Error(uploadErr.message || 'Unable to upload video file to storage. Please check your network connection.');
  }

  reportStatus('Finalizing video URL and metadata...');
  reportProgress(80);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(videoFilePath);
  const publicVideoUrl = urlData?.publicUrl || '';
  if (!publicVideoUrl) {
    throw new Error('Failed to resolve public storage URL for the uploaded video.');
  }

  // 3. Database insert into public.videos
  reportStatus('Publishing video to GramMate feed...');
  reportProgress(90);

  const sanitizedTags = Array.isArray(tags) ? tags.filter(Boolean).slice(0, 10) : [];
  const fullVideoRow = {
    user_id: userId,
    title: (title || 'Untitled Video').trim(),
    description: (description || '').trim(),
    video_url: publicVideoUrl,
    thumbnail_url: thumbnailUrl || publicVideoUrl,
    category: category || 'General',
    tags: sanitizedTags,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  let { data: insertedVideo, error: dbErr } = await supabase
    .from('videos')
    .insert(fullVideoRow)
    .select()
    .single();

  if (dbErr && (dbErr.code === 'PGRST204' || dbErr.message?.includes('category') || dbErr.message?.includes('tags'))) {
    console.warn('[supabaseService] Retrying video insert with base columns...');
    const baseVideoRow = {
      user_id: userId,
      title: (title || 'Untitled Video').trim(),
      description: (description || '').trim(),
      video_url: publicVideoUrl,
      thumbnail_url: thumbnailUrl || publicVideoUrl,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const retryResult = await supabase
      .from('videos')
      .insert(baseVideoRow)
      .select()
      .single();
    insertedVideo = retryResult.data;
    dbErr = retryResult.error;
  }

  if (dbErr) {
    console.error('[supabaseService] Database insert error for video:', dbErr);
    // Cleanup uploaded storage file so no orphaned files remain
    await supabase.storage.from(bucket).remove([videoFilePath]).catch(() => {});
    if (thumbnailUrl) {
      await supabase.storage.from(bucket).remove([`${userId}/${uniqueId}_thumb.jpg`]).catch(() => {});
    }

    if (dbErr.code === '42501' || dbErr.message?.toLowerCase().includes('policy')) {
      throw new Error(
        'Database permission error: Supabase Row Level Security blocked video publishing. Run supabase/storage_setup.sql in the Supabase SQL editor to ensure the videos table allows creators to insert their videos.'
      );
    }
    throw new Error(dbErr.message || 'Unable to publish video to the GramMate database.');
  }

  reportStatus('Published successfully!');
  reportProgress(100);
  return insertedVideo;
}

export async function deleteVideo(videoId, userId) {
  try {
    let query = supabase.from('videos').delete().eq('id', videoId);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[supabaseService] deleteVideo error:', err?.message || err);
    throw err;
  }
}

// ─── Likes System ───

export async function hasUserLiked(videoId, userId) {
  if (!userId || !videoId) return false;
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .maybeSingle();

    return !error && Boolean(data);
  } catch {
    return false;
  }
}

export async function toggleLike(videoId, userId, currentLikedState) {
  if (!userId) throw new Error('Please sign in to like videos.');

  try {
    if (currentLikedState) {
      // Unlike
      await supabase.from('likes').delete().eq('video_id', videoId).eq('user_id', userId);
      // Decrement count
      await supabase.rpc('decrement_likes', { target_video_id: videoId }).catch(() => {});
      return false;
    } else {
      // Like
      await supabase.from('likes').insert({ video_id: videoId, user_id: userId });
      // Increment count
      await supabase.rpc('increment_likes', { target_video_id: videoId }).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[supabaseService] toggleLike error:', err?.message || err);
    return currentLikedState;
  }
}

// ─── Comments System ───

export async function fetchComments(videoId) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, user_id, video_id, content, created_at')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    // Fetch comment authors
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    let profilesMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    return comments.map(comment => ({
      ...comment,
      author: profilesMap[comment.user_id] || {
        username: 'viewer',
        full_name: 'GramMate User',
        avatar_url: null,
      }
    }));
  } catch (err) {
    console.warn('[supabaseService] fetchComments error:', err?.message || err);
    return [];
  }
}

export async function addComment(videoId, userId, content) {
  if (!userId) throw new Error('Please sign in to comment.');
  if (!content || !content.trim()) throw new Error('Comment cannot be empty.');

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        video_id: videoId,
        user_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[supabaseService] addComment error:', err?.message || err);
    throw new Error('Failed to post comment. Please try again.', { cause: err });
  }
}

// ─── Wallet & Transactions ───

export async function fetchWallet(userId) {
  if (!userId) return null;
  return fetchWalletSummary(userId);
}

export async function fetchTransactions(userId) {
  if (!userId) return [];
  return fetchWalletLedger(userId);
}

export async function requestWithdrawal(userId, amountCents, method = 'Stripe Bank') {
  if (!userId) throw new Error('Please sign in before requesting a withdrawal.');
  return submitWithdrawalRequest({
    amountCents: Math.abs(amountCents),
    payoutMethod: method,
    destinationLabel: method,
  });
}

// ─── Moderation & Reports ───

export async function submitReport({ videoId, reporterId, reason, description }) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        video_id: videoId,
        reporter_id: reporterId || null,
        reason: reason || 'Inappropriate Content',
        description: description || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabaseService] submitReport error:', err?.message || err);
    throw new Error('Failed to submit report. Please try again.', { cause: err });
  }
}

// ─── Admin Platform Data ───

export async function fetchAdminMetrics() {
  try {
    const [
      { count: usersCount },
      { count: videosCount },
      { count: commentsCount },
      { count: transactionsCount },
      { count: reportsCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 }))
    ]);

    return {
      totalUsers: usersCount || 0,
      totalVideos: videosCount || 0,
      totalComments: commentsCount || 0,
      totalTransactions: transactionsCount || 0,
      totalReports: reportsCount || 0,
    };
  } catch (err) {
    console.error('[supabaseService] fetchAdminMetrics error:', err);
    return {
      totalUsers: 0,
      totalVideos: 0,
      totalComments: 0,
      totalTransactions: 0,
      totalReports: 0,
    };
  }
}

export async function fetchAdminUsers({ search = '', limit = 50 } = {}) {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search && search.trim()) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabaseService] fetchAdminUsers error:', err);
    return [];
  }
}

export async function fetchAdminVideos({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabaseService] fetchAdminVideos error:', err);
    return [];
  }
}

export async function fetchAdminReports() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[supabaseService] fetchAdminReports warning:', err?.message || err);
    return [];
  }
}

export async function updateAdminReportStatus(reportId, status) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[supabaseService] updateAdminReportStatus error:', err);
    throw err;
  }
}

export async function fetchAdminTransactions({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabaseService] fetchAdminTransactions error:', err);
    return [];
  }
}

export default {
  fetchProfileById,
  fetchProfileByUsername,
  updateProfile,
  uploadAvatar,
  fetchFeedVideos,
  fetchUserVideos,
  uploadVideo,
  deleteVideo,
  hasUserLiked,
  toggleLike,
  fetchComments,
  addComment,
  fetchWallet,
  fetchTransactions,
  requestWithdrawal,
  submitReport,
  fetchAdminMetrics,
  fetchAdminUsers,
  fetchAdminVideos,
  fetchAdminReports,
  updateAdminReportStatus,
  fetchAdminTransactions,
};
