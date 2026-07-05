const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSku() {
  console.log('🔍 Checking existing SKUs in product_variants...\n');

  const { data, error } = await supabase.from('product_variants').select('id, sku, product_id').not('sku', 'is', null);
  if (error) {
    console.error('❌ Error fetching variants:', error.message);
    return;
  }

  console.log(`Found ${data.length} variants with an SKU:`);
  data.forEach(v => {
    console.log(`  - SKU: "${v.sku}" (Variant ID: ${v.id}, Product ID: ${v.product_id})`);
  });

}

checkSku().catch(console.error);
