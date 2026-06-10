import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

// Read .env file manually
const envPath = './.env';
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('❌ Failed to read .env file:', e.message);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

console.log('Testing Supabase Connection...');
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing from .env');
} else {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  try {
    // Attempt a select query on public table
    const { data, error } = await supabase.from('videos').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase error:', error.message);
    } else {
      console.log('✅ Supabase connected successfully! Found videos:', data);
    }
  } catch (err) {
    console.error('❌ Supabase exception:', err);
  }
}

console.log('\nTesting Firebase Configuration...');
const firebaseConfig = {
  apiKey: env['VITE_FIREBASE_API_KEY'],
  authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: env['VITE_FIREBASE_PROJECT_ID'],
  storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
  appId: env['VITE_FIREBASE_APP_ID'],
};

console.log('Firebase Project ID:', firebaseConfig.projectId);

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API key missing from .env');
} else {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log('✅ Firebase initialized successfully!');
    
    // Test auth service by attempting a dummy login
    try {
      await signInWithEmailAndPassword(auth, 'invalid-email@example.com', 'dummy-password');
    } catch (authErr) {
      if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-email') {
        console.log(`✅ Firebase Auth connection works (received expected auth error code: ${authErr.code})`);
      } else {
        console.error('❌ Firebase Auth error:', authErr.code, authErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Firebase exception:', err);
  }
}
