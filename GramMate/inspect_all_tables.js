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

async function testTable(tableName) {
  console.log(`Testing table: ${tableName}...`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.log(`❌ Table ${tableName}:`, error.message);
  } else {
    console.log(`✅ Table ${tableName} exists. Columns found in response:`, data.length > 0 ? Object.keys(data[0]) : '(empty table - no rows to inspect columns)');
    // If empty, let's try to query with an empty insert (then rollback/delete) to see column definitions or do a select of specific fields
  }
}

async function run() {
  const tables = ['profiles', 'videos', 'comments', 'wallets', 'transactions', 'follows', 'saved_videos', 'reports', 'withdrawal_requests', 'risk_events', 'support_tickets', 'audit_logs'];
  for (const t of tables) {
    await testTable(t);
  }
}

run().catch(console.error);
