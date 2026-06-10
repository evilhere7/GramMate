/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import SplashLogo from '../components/brand/SplashLogo';
import {
  login as apiLogin,
  register as apiRegister,
  refreshSession,
  logout as apiLogout,
  requestPasswordReset,
  resetPassword as apiResetPassword,
} from '../services/auth';
import { setAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await refreshSession();
      if (response?.accessToken) {
        setAuthToken(response.accessToken);
      }
      setUser(response?.user ?? null);
      return response;
    } catch (error) {
      clearAuthToken();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = async (email, password) => {
    setAuthProcessing(true);
    try {
      const response = await apiLogin({ email, password });
      setAuthToken(response.accessToken);
      setUser(response.user);
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      throw error;
    } finally {
      setAuthProcessing(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setAuthProcessing(true);
    try {
      const response = await apiRegister({ email, password, ...metadata });
      setAuthToken(response.accessToken);
      setUser(response.user);
      toast.success('Account created successfully');
      return response;
    } catch (error) {
      throw error;
    } finally {
      setAuthProcessing(false);
    }
  };

  const signInWithGoogle = async (redirectTo = '/feed') => {
    setAuthProcessing(true);
    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    const authUrl = `${apiBase.replace(/\/$/, '')}/auth/google/redirect?redirectTo=${encodeURIComponent(redirectTo)}`;
    const popup = window.open(authUrl, 'GramMateGoogleAuth', 'popup=yes,toolbar=no,location=no,status=no,menubar=no,width=520,height=720');

    if (!popup) {
      window.location.href = authUrl;
      return;
    }

    return new Promise((resolve, reject) => {
      const handleMessage = async (event) => {
        if (event?.data?.type !== 'GRAMMATE_GOOGLE_AUTH') return;

        const origin = new URL(apiBase, window.location.origin).origin;
        if (event.origin !== window.location.origin && event.origin !== origin) {
          return;
        }

        window.removeEventListener('message', handleMessage);
        popup.close();

        if (event.data.status === 'success') {
          try {
            const session = await restoreSession();
            if (!session) {
              throw new Error('Google authentication succeeded, but session restoration failed.');
            }
            toast.success('Signed in with Google successfully');
            resolve(session);
          } catch (error) {
            reject(error);
          }
          return;
        }

        reject(new Error(event.data.message || 'Google authentication failed.'));
      };

      const intervalId = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(intervalId);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Google sign-in was cancelled or blocked.'));
        }
      }, 500);

      window.addEventListener('message', handleMessage);
    }).finally(() => {
      setAuthProcessing(false);
    });
  };

  const signOut = async () => {
    setAuthProcessing(true);
    try {
      await apiLogout();
      clearAuthToken();
      setUser(null);
      toast.success('Signed out successfully');
    } finally {
      setAuthProcessing(false);
    }
  };

  const resetPassword = async (email) => {
    setAuthProcessing(true);
    try {
      const response = await requestPasswordReset({ email });
      toast.success('Password reset link sent if the account exists.');
      return response;
    } finally {
      setAuthProcessing(false);
    }
  };

  const updatePassword = async (payload) => {
    return apiResetPassword(payload);
  };

  const value = {
    user,
    loading,
    authProcessing,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <SplashLogo fullScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
