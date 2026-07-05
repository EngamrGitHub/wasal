const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      orders(*),
      products!inner(*, product_images(*)),
      variant:product_variants(*, colors(*), sizes(*))
    `);
    
  console.log(`عدد order_items المرجعة عن طريق Inner Join: ${data ? data.length : 0}`);
  if (data && data.length > 0) {
    console.log(`أول أوردر آيتم Product ID: ${data[0].product_id}`);
    console.log(`اسم المنتج: ${data[0].products?.name_ar}`);
  }
}

run().catch(console.error);
