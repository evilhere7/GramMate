import getSupabaseClient from '../lib/supabase/client';

const supabase = getSupabaseClient;

export async function upsertProfile(profile) {
  try {
    const adminEmail = (typeof process !== 'undefined' && process.env?.SUPABASE_ADMIN_EMAIL) || 'evilmc777@gmail.com';
    const normalized = {
      id: profile.id,
      user_id: profile.user_id || profile.id,
      username: profile.username || null,
      display_name: profile.display_name || profile.full_name || profile.displayName || profile.fullName || null,
      full_name: profile.full_name || profile.displayName || profile.fullName || null,
      avatar_url: profile.avatar_url || profile.photoURL || null,
      banner_url: profile.banner_url || profile.cover_url || null,
      website: profile.website || null,
      bio: profile.bio || null,
      is_verified: !!profile.is_verified,
      updated_at: new Date().toISOString(),
    };

    // Check if profile exists
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle();

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase.from('profiles').update(normalized).eq('id', profile.id);
      if (error) throw error;
      return data;
    } else {
      // Try to insert (trigger might have already handled it or will handle it)
      const insertData = {
        ...normalized,
        created_at: profile.created_at || new Date().toISOString(),
      };
      const { data, error } = await supabase.from('profiles').insert(insertData);
      if (error) {
        console.warn('[Supabase] Profile insert failed (expected if trigger handles it):', error.message);
      }
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] upsertProfile error', err?.message || err);
    throw err;
  }
}

export async function fetchProfileById(id) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchProfileById error', err?.message || err);
    return null;
  }
}

export async function uploadAvatar(file, userId) {
  if (!file) throw new Error('No file provided');
  const bucket = 'avatars';
  const path = `public/${userId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

export async function uploadVideo(file, userId, { title, description, category, visibility } = {}) {
  if (!file) throw new Error('No file provided');
  const bucket = 'videos';
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '31536000', upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

  const { error: dbError } = await supabase.from('videos').insert({
    creator_id: userId,
    user_id: userId,
    title,
    description,
    category,
    visibility,
    status: visibility === 'public' ? 'published' : 'draft',
    processing_status: 'queued',
    moderation_status: 'pending',
    video_url: publicUrl,
    created_at: new Date().toISOString(),
  });
  if (dbError) throw dbError;

  return { publicUrl, filePath };
}

export function subscribeToTable(table, callback) {
  const channel = supabase.channel(table).on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => callback(payload)).subscribe();
  return () => channel.unsubscribe();
}

export default { upsertProfile, fetchProfileById, uploadAvatar, uploadVideo, subscribeToTable };
