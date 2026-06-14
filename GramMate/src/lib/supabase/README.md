Supabase integration notes

Environment variables
- VITE_SUPABASE_URL: Supabase project URL (browser)
- VITE_SUPABASE_ANON_KEY: Supabase anon/public key (browser)
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: alternate names
- SUPABASE_ADMIN_EMAIL: optional admin email to auto-assign role on profile creation (defaults to evilmc777@gmail.com)

Files added
- client.js: Browser singleton client
- server.js: SSR helper (createServerSupabaseClient wrapper)
- middleware.js: client-side helpers `requireAuth`, `getCurrentSupabaseUser`
- services/supabaseService.js: helpers (upsertProfile, fetchProfileById, uploadAvatar, subscribeToTable)
- services/supabaseAuth.js: auth helpers (signUp, signIn, signInWithGoogle, signOut, onAuthChanged, sendResetPasswordEmail, updatePassword)
- policies.sql: example table, policies, and triggers to run in Supabase SQL editor

Next steps
- Run the SQL in `policies.sql` inside Supabase SQL editor to create the `profiles` table and policies.
- Create Storage buckets: `avatars`, `videos`. Configure CORS and bucket-level policies.
- If you want to migrate users from Firebase to Supabase Auth, export users and import via Supabase Admin API (requires service_role key). I can prepare migration scripts if desired.
- Replace legacy `src/services/auth.js` API calls with Supabase direct calls where appropriate (done for main flows).

Security notes
- Never commit service_role keys to the repo. Use server-side environment variables and Supabase Edge Functions or a secure backend to perform admin operations.
- Enforce RLS and avoid using service_role in client-side code.
