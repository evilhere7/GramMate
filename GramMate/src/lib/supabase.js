import supabaseClient, { getSupabaseClient } from './supabase/client';

// Backwards-compatible export for modules importing `supabase`.
const supabase = supabaseClient;
export { supabase };
export { getSupabaseClient };
export default supabase;
