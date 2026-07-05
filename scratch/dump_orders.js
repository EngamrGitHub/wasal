const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: orders } = await supabase.from('orders').select('*, order_items(*)');
  console.log(`عدد الطلبات: ${orders.length}`);
  if (orders.length > 0) {
    console.log(JSON.stringify(orders, null, 2));
  }
}
run().catch(console.error);
