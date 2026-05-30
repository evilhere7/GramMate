import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required config keys at startup
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.warn(
    `[Firebase] Missing required environment variables: ${missingKeys.map(k => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ')}. ` +
    'Check your .env file.'
  );
}

// Initialize Firebase only once (guards against HMR double-init)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth with persistent session (survives tab close)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('[Firebase Auth] Could not set persistence:', err.message);
});

// Analytics (only in browser, skips SSR/prerender)
export let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

export default app;
