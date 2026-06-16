/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const profileCache = new Map();

function normalizeProfile(profile, user) {
  if (!user && !profile) return null;
  const handle = profile?.username || user?.email?.split('@')[0] || 'creator';
  const displayName = profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || handle;

  return {
    ...profile,
    id: profile?.id || user?.id,
    user_id: profile?.user_id || profile?.id || user?.id,
    username: handle,
    display_name: displayName,
    full_name: profile?.full_name || displayName,
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
    banner_url: profile?.banner_url || profile?.cover_url || null,
    website: profile?.website || profile?.public_url || '',
    role: profile?.role || 'viewer',
    followers_count: profile?.followers_count || 0,
    following_count: profile?.following_count || 0,
  };
}

export function useProfile(profileId) {
  const { user } = useAuth();
  const targetId = profileId || user?.id;
  const [profile, setProfile] = useState(() => profileCache.get(targetId) || null);
  const [loading, setLoading] = useState(Boolean(targetId && !profileCache.has(targetId)));
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    const cached = profileCache.get(targetId);
    if (cached) setProfile(cached);

    setLoading(!cached);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${targetId},user_id.eq.${targetId}`)
      .maybeSingle();

    if (queryError) {
      setError(queryError);
      setLoading(false);
      return null;
    }

    const normalized = normalizeProfile(data, targetId === user?.id ? user : null);
    if (normalized) profileCache.set(targetId, normalized);
    setProfile(normalized);
    setLoading(false);
    return normalized;
  }, [targetId, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('You must be signed in to update your profile.');

    const payload = {
      id: user.id,
      user_id: user.id,
      username: updates.username,
      display_name: updates.display_name,
      full_name: updates.display_name,
      bio: updates.bio,
      avatar_url: updates.avatar_url,
      banner_url: updates.banner_url,
      cover_url: updates.banner_url,
      website: updates.website,
      updated_at: new Date().toISOString(),
    };

    const { data, error: upsertError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (upsertError) throw upsertError;

    const normalized = normalizeProfile(data, user);
    profileCache.set(user.id, normalized);
    setProfile(normalized);
    return normalized;
  }, [user]);

  const value = useMemo(() => {
    const role = profile?.role;
    const isCreator = ['creator', 'admin', 'moderator'].includes(role) || Boolean(profile?.creator_badge);
    return { profile, loading, error, isCreator, refetch: fetchProfile, updateProfile };
  }, [profile, loading, error, fetchProfile, updateProfile]);

  return value;
}

export default useProfile;
