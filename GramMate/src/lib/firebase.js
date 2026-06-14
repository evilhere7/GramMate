import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Default Firebase configuration (falls back to explicit constants so
// the app works immediately if env vars are not provided).
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA2qiP4SfHqL_NQMFamJeMpkFgqcJZyCNU",
  authDomain: "evil-2e175.firebaseapp.com",
  projectId: "evil-2e175",
  storageBucket: "evil-2e175.firebasestorage.app",
  messagingSenderId: "99584273512",
  appId: "1:99584273512:web:c73b66f7f92faa15bb9fdd",
  measurementId: "G-GT73F35P5B",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.warn(
    `[Firebase] Missing required configuration keys: ${missingKeys.join(', ')}. Using defaults where available.`
  );
}

// Initialize Firebase once (handles HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export auth instance and ensure persistent sessions
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  // Non-fatal: continue without persistence if environment blocks it
  console.warn('[Firebase Auth] Could not set persistence:', err?.message || err);
});

// Export analytics only when supported in the browser
export let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {});

export default app;
