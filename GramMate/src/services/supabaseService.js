import getSupabaseClient from '../lib/supabase/client';

const supabase = getSupabaseClient;

export async function upsertProfile(profile) {
  try {
    // Normalize fields and assign admin role automatically for configured admin email
    const adminEmail = process.env.SUPABASE_ADMIN_EMAIL || 'evilmc777@gmail.com';
    const normalized = {
      id: profile.id,
      email: profile.email || null,
      username: profile.username || profile.email?.split('@')[0] || null,
      display_name: profile.displayName || profile.display_name || null,
      avatar_url: profile.photoURL || profile.avatar_url || null,
      bio: profile.bio || null,
      is_verified: !!profile.is_verified,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: profile.last_login || new Date().toISOString(),
      role: profile.role || (profile.email === adminEmail ? 'admin' : 'user'),
    };

    const { data, error } = await supabase.from('profiles').upsert(normalized, { onConflict: 'id' });
    if (error) throw error;
    return data;
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
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

export async function uploadVideo(file, userId, { title, description, category, visibility } = {}) {
  if (!file) throw new Error('No file provided');
  const bucket = 'videos';
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '31536000', upsert: false });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

  const { error: dbError } = await supabase.from('videos').insert({
    user_id: userId,
    title,
    description,
    category,
    visibility,
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
