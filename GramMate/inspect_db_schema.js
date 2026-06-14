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
  console.log('Testing column insertion/checks on profiles...');
  
  // 1. Try to upsert a dummy profile with a role field to see if it exists
  const tempId = '00000000-0000-0000-0000-000000000000'; // Needs to be a valid UUID for DB constraints if it expects UUID
  
  const { data: selectBefore, error: selectBeforeErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'roshanrimal')
    .single();
    
  console.log('Sample profile full structure:', selectBefore);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: tempId,
      username: 'temp_test_user',
      role: 'user'
    });
    
  console.log('Upsert with role "user" result:', { data, error });
  
  const { data: data2, error: error2 } = await supabase
    .from('profiles')
    .upsert({
      id: tempId,
      username: 'temp_test_user',
      role: 'super_admin'
    });
    
  console.log('Upsert with role "super_admin" result:', { data: data2, error: error2 });
  
  // Clean up
  const { error: deleteErr } = await supabase
    .from('profiles')
    .delete()
    .eq('id', tempId);
  console.log('Cleanup delete result:', deleteErr);
}

run().catch(console.error);
