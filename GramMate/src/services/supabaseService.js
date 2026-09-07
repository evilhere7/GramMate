import { supabase } from '../lib/supabase';

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
    let query = supabase
      .from('videos')
      .select(`
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
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: videos, error } = await query;
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
        .select('id, username, full_name, display_name, avatar_url, is_verified')
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

export async function uploadVideo(file, userId, { title, description, category, tags = [] } = {}) {
  if (!file) throw new Error('No video file provided');
  const bucket = 'videos';
  const ext = file.name.split('.').pop() || 'mp4';
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // Upload to Supabase storage
  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '31536000', upsert: true });

  if (uploadErr) {
    console.error('[supabaseService] Supabase video storage upload error:', uploadErr);
    const msg = uploadErr.message || '';
    if (msg.toLowerCase().includes('bucket not found')) {
      throw new Error("Supabase storage bucket 'videos' not found. Please run storage_setup.sql in your Supabase SQL Editor to create it.");
    }
    if (msg.toLowerCase().includes('row-level security') || uploadErr.statusCode === '403') {
      throw new Error("Storage permission error: Please ensure storage policies are applied by running storage_setup.sql in your Supabase SQL Editor.");
    }
    throw new Error(msg || 'Unable to upload video file to storage. Please try again.');
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = urlData?.publicUrl || '';

  // Prepare video row (attempt full row first)
  const fullVideoRow = {
    user_id: userId,
    title: title || 'Untitled Video',
    description: description || '',
    video_url: publicUrl,
    thumbnail_url: null,
    category: category || 'General',
    tags: tags || [],
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: new Date().toISOString(),
  };

  let { data: insertedVideo, error: dbErr } = await supabase
    .from('videos')
    .insert(fullVideoRow)
    .select()
    .single();

  // If columns like 'category' or 'tags' do not exist in DB yet, fallback without them
  if (dbErr && (dbErr.code === 'PGRST204' || dbErr.message?.includes('category') || dbErr.message?.includes('tags'))) {
    console.warn('[supabaseService] Retrying video insert without category/tags schema dependency...');
    const baseVideoRow = {
      user_id: userId,
      title: title || 'Untitled Video',
      description: description || '',
      video_url: publicUrl,
      thumbnail_url: null,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
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
    console.error('[supabaseService] Failed to insert video into database:', dbErr);
    if (dbErr.code === '42501') {
      throw new Error("Database RLS permission error: Please run the SQL migration in Supabase to allow video uploads.");
    }
    throw new Error(dbErr.message || 'Unable to publish video to database.');
  }

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
        .select('id, username, full_name, display_name, avatar_url')
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
    throw new Error('Failed to post comment. Please try again.');
  }
}

// ─── Wallet & Transactions ───

export async function fetchWallet(userId) {
  if (!userId) return null;
  try {
    let { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet && !error) {
      // Create initial wallet
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance_cents: 0,
          pending_cents: 0,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      wallet = newWallet;
    }

    return wallet || { balance_cents: 0, pending_cents: 0 };
  } catch (err) {
    console.warn('[supabaseService] fetchWallet warning:', err?.message || err);
    return { balance_cents: 0, pending_cents: 0 };
  }
}

export async function fetchTransactions(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[supabaseService] fetchTransactions warning:', err?.message || err);
    return [];
  }
}

export async function requestWithdrawal(userId, amountCents, method = 'Stripe Bank') {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount_cents: -Math.abs(amountCents),
        transaction_type: 'withdrawal',
        status: 'pending',
        description: `Payout request via ${method}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[supabaseService] requestWithdrawal error:', err?.message || err);
    throw new Error('Could not submit payout request. Please try again.');
  }
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
    throw new Error('Failed to submit report. Please try again.');
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
