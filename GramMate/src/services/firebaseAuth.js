import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { confirmPasswordReset as firebaseConfirmPasswordReset } from 'firebase/auth';

async function createOrUpdateProfile(user) {
  if (!user || !user.uid) return null;
  const profile = {
    id: user.uid,
    email: user.email || null,
    full_name: user.displayName || null,
    display_name: user.displayName || null,
    avatar_url: user.photoURL || null,
    provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId?.includes('google') ? 'google' : (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password'),
    created_at: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toISOString() : new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  // Upsert into Supabase `profiles` table (id = uid)
  try {
    const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
    if (error) {
      console.warn('[Profile] Supabase upsert error:', error.message || error);
    }
  } catch (err) {
    console.warn('[Profile] Could not upsert to Supabase:', err?.message || err);
  }

  return profile;
}

export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    // Normalize user object
    const user = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      providerData: fbUser.providerData,
      metadata: fbUser.metadata || {},
    };

    // Ensure profile exists and update last_login
    try {
      await createOrUpdateProfile(user);
    } catch (err) {
      console.warn('[Auth] createOrUpdateProfile failed', err?.message || err);
    }

    callback(user);
  });
}

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  // Force Google to show account chooser every time
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    await createOrUpdateProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      providerData: fbUser.providerData,
      metadata: fbUser.metadata || {},
    });
    return { user: fbUser };
  } catch (err) {
    // Handle common Firebase error codes
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup closed before completing.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Check your connection and try again.');
    }
    if (err.code === 'auth/account-exists-with-different-credential') {
      // Try to give a helpful message with available sign-in methods
      const email = err.customData?.email;
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => []);
        throw new Error(`An account already exists with the same email using: ${methods.join(', ')}. Use that provider to sign in.`);
      }
    }
    throw err;
  }
}

// Backwards-compatible alias and a cleaner public API name
export const signInWithGoogle = signInWithGooglePopup;

export function getCurrentUser() {
  return auth.currentUser
    ? {
        uid: auth.currentUser.uid,
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        providerData: auth.currentUser.providerData,
      }
    : null;
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (!fbUser) return callback(null);
    const user = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      providerData: fbUser.providerData,
      metadata: fbUser.metadata || {},
    };
    callback(user);
  });
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export async function signUpWithEmail({ email, password, displayName }) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await updateProfile(userCred.user, { displayName });
    } catch (err) {
      console.warn('[Auth] updateProfile failed:', err?.message || err);
    }
  }
  await sendEmailVerification(userCred.user).catch(() => {});

  await createOrUpdateProfile({
    uid: userCred.user.uid,
    email: userCred.user.email,
    displayName: userCred.user.displayName,
    photoURL: userCred.user.photoURL,
    providerData: userCred.user.providerData,
    metadata: userCred.user.metadata || {},
  });

  return { user: userCred.user };
}

export async function signInWithEmail({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;
    await createOrUpdateProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      providerData: fbUser.providerData,
      metadata: fbUser.metadata || {},
    });
    return { user: fbUser };
  } catch (err) {
    if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Check your connection and try again.');
    }
    throw err;
  }
}

export async function sendResetPasswordEmail(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Do not reveal whether account exists
      return true;
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Check your connection and try again.');
    }
    throw err;
  }
}

export async function logout() {
  await firebaseSignOut(auth);
}

export async function updatePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  try {
    await firebaseUpdatePassword(auth.currentUser, newPassword);
    return true;
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      throw new Error('Please re-authenticate and try again.');
    }
    throw err;
  }
}

export async function confirmPasswordReset(code, newPassword) {
  try {
    await firebaseConfirmPasswordReset(auth, code, newPassword);
    return true;
  } catch (err) {
    if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Choose a stronger password.');
    }
    if (err.code === 'auth/invalid-action-code') {
      throw new Error('Reset token is invalid or expired. Request a new reset email.');
    }
    throw err;
  }
}

const defaultExport = {
  signInWithGoogle: signInWithGooglePopup,
  signInWithGooglePopup,
  signUpWithEmail,
  signInWithEmail,
  sendResetPasswordEmail,
  logout,
  signOutUser,
  onAuthChanged,
  getCurrentUser,
  observeAuthState,
  updatePassword,
  confirmPasswordReset,
};

export default defaultExport;
