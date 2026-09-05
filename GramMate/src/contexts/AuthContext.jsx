/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import SplashLogo from '../components/brand/SplashLogo';
import supabaseAuth from '../services/supabaseAuth';
import { fetchProfileById } from '../services/supabaseService';

const AuthContext = createContext();

function getFirebaseErrorMessage(error) {
  const code = error?.code || '';
  const msg = error?.message || '';

  const firebaseErrorMap = {
    'auth/user-not-found': 'No account found with that email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few moments and try again.',
    'auth/network-request-failed': 'Network connection issue. Please check your internet.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before completing.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Sign-in popup was blocked by browser. Please allow popups for this site.',
    'auth/missing-password': 'Password is required.',
  };

  if (code && firebaseErrorMap[code]) {
    return firebaseErrorMap[code];
  }

  for (const [key, value] of Object.entries(firebaseErrorMap)) {
    if (msg.includes(key)) {
      return value;
    }
  }

  return msg || 'An authentication error occurred. Please try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = supabaseAuth.onAuthChanged((authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updated = await fetchProfileById(user.id);
      if (updated) {
        setUser((prev) => (prev ? { ...prev, profile: updated, displayName: updated.full_name || prev.displayName, photoURL: updated.avatar_url || prev.photoURL } : prev));
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh profile:', err);
    }
  }, [user?.id]);

  const signIn = async (email, password) => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signInWithEmail({ email, password });
      toast.success('Signed in successfully.');
      return response;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      toast.error(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setAuthProcessing(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signUpWithEmail({
        email,
        password,
        displayName: metadata.fullName || metadata.displayName || metadata.username,
        username: metadata.username,
      });
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      toast.error(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setAuthProcessing(false);
    }
  };

  const signInWithGoogle = async () => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signInWithGoogle();
      toast.success('Signed in with Google!');
      return response;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      const code = error?.code || '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        toast.error(friendlyMsg);
      }
      throw new Error(friendlyMsg);
    } finally {
      setAuthProcessing(false);
    }
  };

  const signOut = async () => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      await supabaseAuth.signOutUser();
      setUser(null);
      toast.success('Signed out.');
    } catch (error) {
      console.error('[AuthContext] Sign-out error:', error);
      setUser(null);
    } finally {
      setAuthProcessing(false);
    }
  };

  const resetPassword = async (email) => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.sendResetPasswordEmail(email);
      toast.success('Password reset email sent. Please check your inbox.');
      return { error: null };
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      toast.error(friendlyMsg);
      return { error: { message: friendlyMsg } };
    } finally {
      setAuthProcessing(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.updatePassword(newPassword);
      toast.success('Password updated successfully.');
      return true;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      toast.error(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setAuthProcessing(false);
    }
  };

  const value = {
    user,
    loading,
    authProcessing,
    isAdmin: Boolean(user?.isAdmin),
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
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
