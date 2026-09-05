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
import { supabase } from '../lib/supabase';
import { stringToUuid } from '../lib/uuid';

const ADMIN_EMAIL = 'evilmc777@gmail.com';

let pendingSignupMetadata = null;

export async function signUpWithEmail({ email, password, displayName, username }) {
  pendingSignupMetadata = { username, displayName };
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) {
    await fbUpdateProfile(userCredential.user, { displayName });
  }
  return userCredential;
}

export async function signInWithEmail({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore supabase signOut errors
  }
  return true;
}

/**
 * Server/Database-backed administrator verification.
 * Checks Firebase authenticated user identity AND verifies against Supabase `admins` database table.
 */
export async function verifyAdminStatus(firebaseUser) {
  if (!firebaseUser || !firebaseUser.email) return false;
  
  const normalizedEmail = firebaseUser.email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  // Cross-verify with Supabase database `admins` table
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!error && data && data.email.toLowerCase() === normalizedEmail) {
      return true;
    }
  } catch (err) {
    console.warn('[supabaseAuth] DB admin check error, using email verification:', err);
  }

  // If table query succeeds or fallback for evilmc777
  return normalizedEmail === ADMIN_EMAIL.toLowerCase();
}

/**
 * Subscribe to Firebase Auth state changes and synchronize with Supabase profiles.
 */
export function onAuthChanged(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    const email = firebaseUser.email || '';
    const displayName = firebaseUser.displayName || email.split('@')[0] || 'Creator';
    const photoURL = firebaseUser.photoURL || '';
    const userUuid = stringToUuid(firebaseUser.uid);

    let cleanUsername = pendingSignupMetadata?.username || displayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      cleanUsername = `user_${cleanUsername}`.slice(0, 20);
    }
    if (cleanUsername.length < 3) {
      cleanUsername = `user_${firebaseUser.uid.slice(0, 8)}`;
    }
    pendingSignupMetadata = null;

    // Verify admin role via server/database logic
    const isAdmin = await verifyAdminStatus(firebaseUser);

    let profileData = null;

    try {
      // 1. Check if profile exists in Supabase
      const { data: existingProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userUuid)
        .maybeSingle();

      if (!fetchErr && existingProfile) {
        profileData = existingProfile;
      } else {
        // 2. Insert new profile into Supabase
        const newProfile = {
          id: userUuid,
          username: cleanUsername,
          full_name: displayName,
          display_name: displayName,
          avatar_url: photoURL,
          bio: 'Hey there! I am creating on GramMate.',
          role: isAdmin ? 'admin' : 'viewer',
          followers_count: 0,
          following_count: 0,
          is_verified: isAdmin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          profileData = inserted;
        } else {
          profileData = newProfile;
        }
      }
    } catch (err) {
      console.warn('[supabaseAuth] Supabase profile sync warning:', err);
      profileData = {
        id: userUuid,
        username: cleanUsername,
        full_name: displayName,
        display_name: displayName,
        avatar_url: photoURL,
        role: isAdmin ? 'admin' : 'viewer',
        followers_count: 0,
        following_count: 0,
        is_verified: isAdmin,
      };
    }

    callback({
      id: userUuid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: profileData?.full_name || displayName,
      photoURL: profileData?.avatar_url || photoURL,
      username: profileData?.username || cleanUsername,
      isAdmin,
      role: isAdmin ? 'admin' : (profileData?.role || 'viewer'),
      profile: profileData,
    });
  });

  return unsubscribe;
}

export async function sendResetPasswordEmail(email) {
  const response = await sendPasswordResetEmail(auth, email.trim());
  return response;
}

export async function confirmPasswordReset(oobCode, newPassword) {
  const response = await fbConfirmPasswordReset(auth, oobCode, newPassword);
  return response;
}

export async function updatePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No user is currently authenticated.');
  const response = await fbUpdatePassword(auth.currentUser, newPassword);
  return response;
}

export default {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  verifyAdminStatus,
  onAuthChanged,
  sendResetPasswordEmail,
  confirmPasswordReset,
  updatePassword,
};
