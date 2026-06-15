import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  confirmPasswordReset as fbConfirmPasswordReset
} from 'firebase/auth';
import auth from '../lib/firebase';
import getSupabaseClient from '../lib/supabase/client';
import { upsertProfile } from './supabaseService';

const supabase = getSupabaseClient;

export async function signUpWithEmail({ email, password, displayName }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await fbUpdateProfile(userCredential.user, { displayName });
  }
  return userCredential;
}

export async function signInWithEmail({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(auth, provider);
  return result;
}

export async function signOutUser() {
  await signOut(auth);
  await supabase.auth.signOut().catch(() => {});
  return true;
}

export function onAuthChanged(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      // Clear Supabase session on logout
      await supabase.auth.signOut().catch(() => {});
      callback(null);
      return;
    }

    const email = firebaseUser.email || `${firebaseUser.uid}@firebase.grammate.internal`;
    const password = `FbPepper_${firebaseUser.uid}_SecurePass!`;
    const displayName = firebaseUser.displayName || email.split('@')[0];
    const photoURL = firebaseUser.photoURL || '';

    let cleanUsername = displayName.replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      cleanUsername = (cleanUsername + '_user').substring(0, 30);
    }
    if (cleanUsername.length < 3) {
      cleanUsername = 'user_' + Math.random().toString(36).substring(2, 7);
    }
    cleanUsername = cleanUsername.substring(0, 30);

    let supabaseUser = null;
    
    // Check if we already have the correct Supabase session active
    const { data: { user: currentSupabaseUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    
    if (currentSupabaseUser && currentSupabaseUser.email === email) {
      supabaseUser = currentSupabaseUser;
    } else {
      // Try to sign in to Supabase Auth silently
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        supabaseUser = signInData.user;
      } catch (err) {
        // If sign in fails, create shadow user in Supabase
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                displayName,
                photoURL,
                username: cleanUsername,
              }
            }
          });
          if (signUpError) throw signUpError;
          supabaseUser = signUpData.user;
        } catch (signUpErr) {
          console.error('[supabaseAuth] Failed to establish shadow user session in Supabase:', signUpErr);
        }
      }
    }

    if (supabaseUser) {
      try {
        // Sync user profile in Supabase profiles table
        await upsertProfile({
          id: supabaseUser.id,
          username: cleanUsername,
          full_name: displayName,
          avatar_url: photoURL,
        });
      } catch (profileErr) {
        console.warn('[supabaseAuth] Profile sync failed:', profileErr);
      }
      
      callback({
        id: supabaseUser.id,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: photoURL,
      });
    } else {
      // Fallback: pass Firebase info directly
      callback({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: photoURL,
      });
    }
  });

  return unsubscribe;
}

export async function sendResetPasswordEmail(email, redirectTo) {
  // Firebase Auth handles password reset by email. Action code settings are optional.
  const response = await sendPasswordResetEmail(auth, email);
  return response;
}

export async function confirmPasswordReset(accessToken, newPassword) {
  // accessToken is the oobCode sent in the Firebase reset link
  const response = await fbConfirmPasswordReset(auth, accessToken, newPassword);
  return response;
}

export async function updatePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No user is currently authenticated with Firebase.');
  const response = await fbUpdatePassword(auth.currentUser, newPassword);
  return response;
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
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
