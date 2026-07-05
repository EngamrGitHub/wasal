const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: stores } = await supabase.from('stores').select('id, name');
  console.log('\n--- جدول المتاجر (stores) ---');
  console.log(stores);

  const { data: { users } } = await supabase.auth.admin.listUsers();
  console.log('\n--- المستخدمين والـ store_id بتاعهم ---');
  users.forEach(u => {
    console.log(`- الايميل: ${u.email}`);
    console.log(`- قيمة الـ store_id: ${u.user_metadata?.store_id}`);
    console.log('');
  });
}
run().catch(console.error);
