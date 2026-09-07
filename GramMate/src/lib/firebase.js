import { initializeApp, getApps } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA2qiP4SfHqL_NQMFamJeMpkFgqcJZyCNU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'evil-2e175.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'evil-2e175',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'evil-2e175.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '99584273512',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:99584273512:web:c73b66f7f92faa15bb9fdd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-GT73F35P5B',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Failed to set persistence:', err?.message || err);
  });
}

export { auth, firebaseConfig };
export default auth;
