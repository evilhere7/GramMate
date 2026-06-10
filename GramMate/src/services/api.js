import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeRefresh(callback) {
  refreshSubscribers.push(callback);
}

function publishRefresh(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common.Authorization;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeRefresh((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        const token = response.data?.accessToken;
        if (token) {
          setAuthToken(token);
        }
        publishRefresh(token);
        return api(originalRequest);
      } catch (refreshError) {
        publishRefresh(null);
        clearAuthToken();
        toast.error('Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error?.response?.data?.message || 'An unexpected error occurred';
    if (error.config && !error.config.__isRetryRequest && error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (error.response?.status >= 400) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;
