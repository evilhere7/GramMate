import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  console.log('Fetching columns from information_schema...');
  
  // Use a query on postgrest to query information_schema or a catalog table.
  // Note: Postgrest exposes information_schema if enabled, or we can use custom sql rpc if defined,
  // or we can run a select to check what columns we can select.
  // Let's run a select query on a non-existent column to see the error message which lists valid columns,
  // or we can select from the profiles table.
  const { data, error } = await supabase.from('profiles').select('non_existent_column_name_test').limit(1);
  console.log('Result for non_existent_column:', error?.message);
}

run().catch(console.error);
