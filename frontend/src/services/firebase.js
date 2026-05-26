import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA2qiP4SfHqL_NQMFamJeMpkFgqcJZyCNU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "evil-2e175.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "evil-2e175",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "evil-2e175.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "99584273512",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:99584273512:web:c73b66f7f92faa15bb9fdd",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-GT73F35P5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence)
  .catch((error) => console.error("Firebase persistence error:", error));

const googleProvider = new GoogleAuthProvider();

// ===== AUTHENTICATION FUNCTIONS =====

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    
    // Optional: Send email verification immediately
    await sendEmailVerification(result.user);
    
    return result.user;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getAuthToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken(true); // Force refresh
  }
  return null;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default auth;
