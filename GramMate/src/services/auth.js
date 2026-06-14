import api from './api';
import supabaseAuth from './supabaseAuth';
import { fetchProfileById } from './supabaseService';

export async function login(payload) {
  try {
    const data = await supabaseAuth.signInWithEmail(payload);
    return data;
  } catch (err) {
    // Fallback to legacy API
    const response = await api.post('/auth/login', payload);
    return response.data;
  }
}

export async function register(payload) {
  try {
    const data = await supabaseAuth.signUpWithEmail(payload);
    return data;
  } catch (err) {
    const response = await api.post('/auth/register', payload);
    return response.data;
  }
}

export async function refreshSession() {
  // Supabase handles session refresh automatically; keep API fallback
  try {
    const user = await supabaseAuth.getCurrentUser();
    return { user };
  } catch (err) {
    const response = await api.post('/auth/refresh');
    return response.data;
  }
}

export async function logout() {
  try {
    await supabaseAuth.signOutUser();
    return { success: true };
  } catch (err) {
    const response = await api.post('/auth/logout');
    return response.data;
  }
}

export async function requestPasswordReset(payload) {
  try {
    const data = await supabaseAuth.sendResetPasswordEmail(payload.email, payload.redirectTo);
    return data;
  } catch (err) {
    const response = await api.post('/auth/forgot-password', payload);
    return response.data;
  }
}

export async function resetPassword(payload) {
  // Use /auth/reset-password API if provided, otherwise unsupported client-side for Supabase
  try {
    throw new Error('Use password reset link flow for Supabase (handled by ResetPassword page).');
  } catch (err) {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  }
}

export async function fetchProfile() {
  try {
    const user = await supabaseAuth.getCurrentUser();
    if (!user) throw new Error('No supabase user');
    const profile = await fetchProfileById(user.id);
    return profile;
  } catch (err) {
    const response = await api.get('/auth/profile');
    return response.data;
  }
}
