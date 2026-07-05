const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('🔄 جاري فحص order_items وتحديث product_id المفقود...');
  
  // Get all order items where product_id is null and variant_id is not null
  const { data: items } = await supabase
    .from('order_items')
    .select('id, variant_id')
    .is('product_id', null)
    .not('variant_id', 'is', null);
    
  if (!items || items.length === 0) {
    console.log('✅ مفيش منتجات مفقودة في order_items.');
    return;
  }
  
  console.log(`⚠️ تم العثور على ${items.length} عنصر مفقود له product_id. جاري التحديث...`);
  
  let updated = 0;
  for (const item of items) {
    // Get product_id from the variant
    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('id', item.variant_id)
      .single();
      
    if (variant && variant.product_id) {
      const { error } = await supabase
        .from('order_items')
        .update({ product_id: variant.product_id })
        .eq('id', item.id);
        
      if (!error) updated++;
    }
  }
  
  console.log(`✅ تم تحديث ${updated} عنصر بنجاح.`);
}

run().catch(console.error);
