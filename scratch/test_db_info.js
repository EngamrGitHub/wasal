const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function check() {
  try {
    // 1. Check schemas/tables using pg_tables
    const { data: tables, error: tableError } = await supabase.rpc('execute_sql', {
      sql_query: "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';"
    });

    if (tableError) {
      console.log("No execute_sql RPC, querying tables via standard calls:");
      
      const { data: p } = await supabase.from('products').select('*').limit(1);
      console.log('Products columns:', p ? Object.keys(p[0] || {}) : 'empty');

      const { data: prof } = await supabase.from('profiles').select('*').limit(1);
      console.log('Profiles columns:', prof ? Object.keys(prof[0] || {}) : 'empty');
      
      const { data: st } = await supabase.from('stores').select('*').limit(1);
      console.log('Stores columns:', st ? Object.keys(st[0] || {}) : 'not exist');
    } else {
      console.log("Tables in public schema:", tables.map(t => t.tablename));
    }
  } catch (err) {
    console.error(err);
  }
}

check();
