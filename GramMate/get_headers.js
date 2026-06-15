import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^["']|["']$/g, '');
  }
});

const url = `${env['VITE_SUPABASE_URL']}/rest/v1/`;
const apiKey = env['VITE_SUPABASE_ANON_KEY'];

async function run() {
  console.log('Fetching from:', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  console.log('Status:', response.status);
  for (const [key, value] of response.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
}

run().catch(console.error);
