const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  // Try calling standard execution RPCs if any exist
  const rpcs = ['execute_sql', 'run_sql', 'exec_sql', 'sql'];
  for (const rpc of rpcs) {
    console.log(`Trying RPC: ${rpc}...`);
    const { data, error } = await supabase.rpc(rpc, {
      query: 'SELECT 1 as val;',
      sql: 'SELECT 1 as val;',
      sql_query: 'SELECT 1 as val;'
    });
    if (!error) {
      console.log(`✅ RPC ${rpc} works! Data:`, data);
      return;
    } else {
      console.log(`❌ RPC ${rpc} failed:`, error.message);
    }
  }
}

test();
