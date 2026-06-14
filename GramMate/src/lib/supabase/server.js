import { createServerSupabaseClient } from '@supabase/ssr';

export function createServerClient({ req, res, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }) {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase SSR] Missing server config environment variables.');
  }
  return createServerSupabaseClient({ req, res, supabaseUrl, supabaseKey });
}

export default createServerClient;
