import api from './api';

export async function login(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function register(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function refreshSession() {
  const response = await api.post('/auth/refresh');
  return response.data;
}

export async function logout() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export async function requestPasswordReset(payload) {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
}

export async function fetchProfile() {
  const response = await api.get('/auth/profile');
  return response.data;
}
