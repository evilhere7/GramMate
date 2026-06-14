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
  console.log('Querying profiles table info...');
  const { data, error } = await supabase.rpc('inspect_schema'); // if helper exists
  if (error) {
    console.log('RPC failed (expected if inspect_schema is not defined). Querying a dummy record or table list instead.');
    
    // Let's query pg_catalog if we have permissions, or just do a simple select
    const { data: selectData, error: selectErr } = await supabase.from('profiles').select('*').limit(1);
    console.log('Select profiles result:', { data: selectData, error: selectErr });
    
    const { data: videosData, error: videosErr } = await supabase.from('videos').select('*').limit(1);
    console.log('Select videos result:', { data: videosData, error: videosErr });
  } else {
    console.log('Schema info:', data);
  }
}

run().catch(console.error);
