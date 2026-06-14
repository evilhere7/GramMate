import { getSupabaseClient } from './client';

// Client-side middleware helper to check auth and redirect if needed
export async function requireAuth(navigate, fallback = '/login') {
  const supabase = getSupabaseClient();
  const { data: { user } = {} } = await supabase.auth.getUser().catch(() => ({}));
  if (!user) {
    navigate(fallback);
    return null;
  }
  return user;
}

export async function getCurrentSupabaseUser() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser().catch(() => ({ data: null }));
  return data?.user ?? null;
}

export default { requireAuth, getCurrentSupabaseUser };
