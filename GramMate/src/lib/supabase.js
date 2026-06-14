import getSupabaseClient from './supabase/client';

// Backwards-compatible export for modules importing `supabase`.
const supabase = getSupabaseClient;
export { supabase };
export default supabase;
