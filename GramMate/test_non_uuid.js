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
  const nonUuid = 'firebase_user_uid_test_123';
  console.log('Testing insert of profile with non-UUID ID:', nonUuid);
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: nonUuid,
      username: 'test_fb_user',
    });
    
  console.log('Insert result:', { data, error });
}

run().catch(console.error);
