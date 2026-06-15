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
  const userId = 'a5d188e9-2eca-47b1-a84a-e0e533c5d98b'; // existing profile id
  console.log('Testing video insert with user ID:', userId);
  
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: userId,
      title: 'Test Video',
      video_url: 'https://example.com/test.mp4',
    })
    .select();
    
  console.log('Insert video result:', { data, error });
}

run().catch(console.error);
