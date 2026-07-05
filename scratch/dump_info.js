const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  console.log(`عدد المستخدمين: ${users.length}`);
  
  users.forEach(u => {
    console.log(`- ايميل: ${u.email} | دور: ${u.user_metadata?.role} | متجر: ${u.user_metadata?.store_id}`);
  });
  
  const { data: stores } = await supabase.from('stores').select('*');
  console.log(`\nعدد المتاجر: ${stores.length}`);
  stores.forEach(s => {
    console.log(`- متجر: ${s.name} (ID: ${s.id})`);
  });
}
run().catch(console.error);
