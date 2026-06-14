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
  console.log('Fetching OpenAPI schema from:', url);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) : 'none');
  
  const response = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Response body:', text);
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }
  
  const schema = await response.json();
  fs.writeFileSync('supabase_schema.json', JSON.stringify(schema, null, 2));
  console.log('✅ Schema saved');
}

run().catch(console.error);
