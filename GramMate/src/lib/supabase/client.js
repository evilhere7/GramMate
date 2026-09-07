import { createClient } from '@supabase/supabase-js';

// Use Vite env vars (fallbacks provided)
const FALLBACK_URL = 'https://aqzhbeystmsifruxpprx.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemhiZXlzdG1zaWZydXhwcHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTE5NzYsImV4cCI6MjA3NTA2Nzk3Nn0.HveptBmhmxjYSfXNUeCEcnGP5JMLSMB2kakvqfQCeq4';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing client configuration. Check environment variables.');
}

let supabase = null;
export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined },
    });
  }
  return supabase;
}

export default getSupabaseClient();
