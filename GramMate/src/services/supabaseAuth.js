import getSupabaseClient from '../lib/supabase/client';
import { upsertProfile } from './supabaseService';

const supabase = getSupabaseClient;

export async function signUpWithEmail({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { displayName } } });
  if (error) throw error;

  // If user returned, upsert profile
  if (data?.user) {
    await upsertProfile({ id: data.user.id, email: data.user.email, displayName: displayName || data.user.user_metadata?.displayName });
  }

  return data;
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // update last_login
  if (data?.user) {
    await upsertProfile({ id: data.user.id, email: data.user.email, last_login: new Date().toISOString() }).catch(() => {});
  }
  return data;
}

export async function signInWithGoogle() {
  // Request OAuth URL (redirect flow). Provide prompt to force account chooser.
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { queryParams: { prompt: 'select_account' } } });
  if (error) throw error;
  // data.url contains redirect URL where the browser should be sent.
  // We'll return the url so callers can open it in a popup or redirect.
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export function onAuthChanged(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session || !session.user) {
      callback(null);
      return;
    }
    const u = session.user;
    // Upsert profile and update last_login
    try {
      await upsertProfile({ id: u.id, email: u.email, displayName: u.user_metadata?.displayName || u.user_metadata?.display_name, photoURL: u.user_metadata?.avatar_url, last_login: new Date().toISOString() });
    } catch (err) {
      console.warn('[supabaseAuth] upsertProfile failed', err?.message || err);
    }
    callback({ id: u.id, uid: u.id, email: u.email, displayName: u.user_metadata?.displayName || u.user_metadata?.display_name, photoURL: u.user_metadata?.avatar_url });
  });
  return () => listener?.subscription?.unsubscribe?.();
}

export async function sendResetPasswordEmail(email, redirectTo) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

export async function confirmPasswordReset(accessToken, newPassword) {
  // Supabase handles password reset via redirect links. This function is not supported client-side.
  throw new Error('Password reset confirmation must be handled via Supabase redirect flow.');
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export function getCurrentUser() {
  return supabase.auth.getUser().then(res => res.data?.user ?? null).catch(() => null);
}

export default {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  onAuthChanged,
  sendResetPasswordEmail,
  confirmPasswordReset,
  updatePassword,
  getCurrentUser,
};
