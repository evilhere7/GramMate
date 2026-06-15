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
  const randomUuid = '11111111-1111-1111-1111-111111111111';
  console.log('Testing insert of profile with ID:', randomUuid);
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: randomUuid,
      username: 'test_fb_user',
      full_name: 'Test Firebase User',
    });
    
  console.log('Insert result:', { data, error });
  
  if (!error) {
    console.log('Delete test profile...');
    const { error: deleteErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', randomUuid);
    console.log('Delete result:', deleteErr);
  }
}

run().catch(console.error);
