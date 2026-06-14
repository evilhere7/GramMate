/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import SplashLogo from '../components/brand/SplashLogo';
import supabaseAuth from '../services/supabaseAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    // Session is restored by Supabase on page load; ensure loading toggles
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    // Subscribe to Supabase auth state; updates user and loading accordingly
    const unsubscribe = supabaseAuth.onAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, [restoreSession]);

  const signIn = async (email, password) => {
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signInWithEmail({ email, password });
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
      const response = await supabaseAuth.signUpWithEmail({
        email,
        password,
        displayName: metadata.fullName || metadata.displayName,
      });
      toast.success('Account created successfully. Check your email for verification.');
      return response;
    } catch (error) {
      throw error;
    } finally {
      setAuthProcessing(false);
    }
  };

  const signInWithGoogle = async () => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      toast.info('Select a Google account');
      toast.info('Opening Google...', { autoClose: 2000 });
      const response = await supabaseAuth.signInWithGoogle();
      // If response contains a URL, redirect the browser there (OAuth redirect flow)
      if (response?.url) {
        window.location.href = response.url;
      }
      toast.success('Successfully signed in with Google');
      return response;
    } catch (error) {
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('popup-closed') || msg.toLowerCase().includes('popup closed')) {
        toast.error('Google sign-in was closed before completing. Try again.');
      } else if (msg.toLowerCase().includes('network')) {
        toast.error('Network error during Google sign-in. Check your connection.');
      } else if (msg.toLowerCase().includes('account already exists')) {
        toast.error(msg);
      } else {
        toast.error('Google authentication failed.');
      }
      throw error;
    } finally {
      setAuthProcessing(false);
    }
  };

  const signOut = async () => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.signOutUser();
      setUser(null);
      toast.success('Signed out successfully');
    } finally {
      setAuthProcessing(false);
    }
  };

  const resetPassword = async (email) => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.sendResetPasswordEmail(email, window.location.origin + '/auth/reset-password');
      toast.success('If the account exists, a password reset email has been sent.');
      return { error: null };
    } finally {
      setAuthProcessing(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.updatePassword(newPassword);
      toast.success('Password updated successfully');
      return true;
    } finally {
      setAuthProcessing(false);
    }
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
