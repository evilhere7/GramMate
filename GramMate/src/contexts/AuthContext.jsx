/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SplashLogo from '../components/brand/SplashLogo';
import supabaseAuth from '../services/supabaseAuth';

const AuthContext = createContext();

// Map Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(error) {
  const code = error?.code || '';
  const msg = error?.message || '';

  const firebaseErrorMap = {
    'auth/user-not-found': 'No account found with that email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact the administrator.',
    'auth/missing-password': 'Please enter your password.',
  };

  if (code && firebaseErrorMap[code]) {
    return firebaseErrorMap[code];
  }

  // Fallback: try to match partial code patterns in the message
  for (const [key, value] of Object.entries(firebaseErrorMap)) {
    if (msg.includes(key)) {
      return value;
    }
  }

  // Final fallback
  if (msg.toLowerCase().includes('popup')) {
    return 'Sign-in popup was closed or blocked. Please try again.';
  }

  return msg || 'An unexpected authentication error occurred.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase auth state changes via supabaseAuth bridge.
    // This fires immediately with the current auth state (restored from persistence),
    // then again whenever the user signs in or out.
    const unsubscribe = supabaseAuth.onAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signInWithEmail({ email, password });
      toast.success('Welcome back!');
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
        role: metadata.role,
        username: metadata.username,
      });
      toast.success('Welcome! Account created successfully.');
      return response;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      toast.error(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setAuthProcessing(false);
    }
  };

  const signInWithGoogle = async (metadata = {}) => {
    if (authProcessing) return;
    setAuthProcessing(true);
    try {
      const response = await supabaseAuth.signInWithGoogle(metadata);
      toast.success('Successfully signed in with Google!');
      return response;
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      // Don't toast for popup-closed (user intentionally dismissed)
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
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('[AuthContext] Sign-out error:', error);
      // Force clear local user state even if sign-out request fails
      setUser(null);
    } finally {
      setAuthProcessing(false);
    }
  };

  const resetPassword = async (email) => {
    setAuthProcessing(true);
    try {
      await supabaseAuth.sendResetPasswordEmail(email, window.location.origin + '/reset-password');
      toast.success('If the account exists, a password reset email has been sent.');
      return { error: null };
    } catch (error) {
      const friendlyMsg = getFirebaseErrorMessage(error);
      return { error: { message: friendlyMsg } };
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
