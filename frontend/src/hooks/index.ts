import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================
// API Client Setup
// ============================================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor - handle 401 and refresh token
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refresh_token = localStorage.getItem('refresh_token');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token,
          });

          localStorage.setItem('access_token', response.data.access_token);
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          // Redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_verified: boolean;
  is_creator: boolean;
  followers_count: number;
  following_count: number;
  videos_count: number;
  total_earned: number;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  save_count: number;
  earnings: number;
  category: string;
  tags: string[];
  status: string;
  is_monetized: boolean;
  is_liked?: boolean;
  is_saved?: boolean;
  creator: User;
  published_at: string;
  created_at: string;
}

interface Wallet {
  available_balance: number;
  pending_balance: number;
  locked_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

// ============================================================
// Authentication Hook
// ============================================================

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Initialize auth on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.get('/users/me');
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user profile');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      setUser(response.data.user);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, username: string, displayName: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post('/auth/register', {
          email,
          password,
          username,
          display_name: displayName,
        });

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        setUser(response.data.user);
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Signup failed';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  const firebaseLogin = useCallback(async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/firebase-login', { id_token: idToken });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      setUser(response.data.user);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Firebase login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    firebaseLogin,
    isAuthenticated: !!user,
  };
};

// ============================================================
// Feed Hook
// ============================================================

export const useFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const pageRef = useRef(0);

  const fetchFeed = useCallback(async (reset = false) => {
    try {
      setLoading(true);

      const response = await api.get('/videos/feed', {
        params: {
          skip: reset ? 0 : pageRef.current * 20,
          limit: 20,
        },
      });

      const newVideos = response.data;

      if (reset) {
        setVideos(newVideos);
        pageRef.current = 1;
      } else {
        setVideos(prev => [...prev, ...newVideos]);
        pageRef.current += 1;
      }

      setHasMore(newVideos.length === 20);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed(false);
    }
  }, [loading, hasMore, fetchFeed]);

  const likeVideo = useCallback(
    async (videoId: string) => {
      try {
        await api.post(`/videos/${videoId}/like`);

        // Optimistic update
        setVideos(prev =>
          prev.map(v =>
            v.id === videoId
              ? {
                  ...v,
                  like_count: (v.like_count || 0) + 1,
                  is_liked: true,
                }
              : v
          )
        );
      } catch (err) {
        console.error('Failed to like video:', err);
      }
    },
    []
  );

  const saveVideo = useCallback(
    async (videoId: string) => {
      try {
        await api.post(`/videos/${videoId}/save`);

        // Optimistic update
        setVideos(prev =>
          prev.map(v =>
            v.id === videoId
              ? {
                  ...v,
                  save_count: (v.save_count || 0) + 1,
                  is_saved: true,
                }
              : v
          )
        );
      } catch (err) {
        console.error('Failed to save video:', err);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchFeed(true);
  }, []);

  return {
    videos,
    loading,
    hasMore,
    fetchFeed,
    loadMore,
    likeVideo,
    saveVideo,
  };
};

// ============================================================
// Wallet Hook
// ============================================================

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/balance');
      setWallet(response.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch wallet';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/transactions');
      setTransactions(response.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch transactions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const withdraw = useCallback(
    async (amount: number, payoutMethodId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post('/wallet/withdraw', {
          amount,
          payout_method_id: payoutMethodId,
        });

        // Refresh wallet after withdrawal
        await fetchWallet();
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Withdrawal failed';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchWallet]
  );

  // Initial load
  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  return {
    wallet,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    withdraw,
  };
};

// ============================================================
// Video Upload Hook
// ============================================================

export const useVideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useCallback(
    async (file: File, metadata: any) => {
      try {
        setUploading(true);
        setError(null);
        setProgress(0);

        // Step 1: Create video record
        const videoResponse = await api.post('/videos', metadata);
        const videoId = videoResponse.data.id;
        const uploadUrl = videoResponse.data.upload_url;

        // Step 2: Upload file to S3 with progress
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await api.put(uploadUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentComplete = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentComplete);
          },
        });

        // Step 3: Trigger video processing
        await api.post(`/videos/${videoId}/process`);

        setProgress(100);
        return videoResponse.data;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Upload failed';
        setError(message);
        throw new Error(message);
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    uploading,
    progress,
    error,
    uploadVideo,
  };
};

// ============================================================
// Realtime Notifications Hook
// ============================================================

export const useRealtimeNotifications = (enabled = true) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/notifications/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to notifications');
    };

    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (enabled && user) {
          // Retry connection
        }
      }, 3000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [enabled, user]);

  const dismissNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    notifications,
    connected,
    dismissNotification,
  };
};

export default {
  useAuth,
  useFeed,
  useWallet,
  useVideoUpload,
  useRealtimeNotifications,
};
