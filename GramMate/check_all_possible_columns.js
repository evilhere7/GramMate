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

async function testColumn(col) {
  const { data, error } = await supabase.from('profiles').select(col).limit(1);
  if (error) {
    console.log(`Column ${col}: ERROR -> ${error.message}`);
  } else {
    console.log(`Column ${col}: EXISTS`);
  }
}

async function run() {
  const columns = ['id', 'firebase_uid', 'email', 'display_name', 'avatar_url', 'created_at', 'last_login', 'role', 'username', 'full_name'];
  for (const col of columns) {
    await testColumn(col);
  }
}

run().catch(console.error);
