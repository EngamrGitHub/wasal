const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('🔄 جاري البحث بدقة عن المنتجات الميتة...');
  
  // 1. Get valid stores
  const { data: stores } = await supabase.from('stores').select('id');
  const validStoreIds = stores.map(s => s.id);
  
  // 2. Get ALL products
  const { data: allProducts } = await supabase.from('products').select('id, name_ar, store_id');
  
  // 3. Filter manually in JS
  const orphanedProducts = allProducts.filter(p => !p.store_id || !validStoreIds.includes(p.store_id));
  
  if (orphanedProducts.length === 0) {
    console.log('✅ الداتا بيز نضيفة ومفيش أي منتجات ملهاش متجر.');
    return;
  }
  
  console.log(`⚠️ تم العثور على ${orphanedProducts.length} منتج ملوش متجر!`);
  const productIds = orphanedProducts.map(p => p.id);
  
  // 4. Delete related order items
  const { data: orphanedVariants } = await supabase
    .from('product_variants')
    .select('id')
    .in('product_id', productIds);
    
  if (orphanedVariants && orphanedVariants.length > 0) {
    const variantIds = orphanedVariants.map(v => v.id);
    console.log(`⚠️ مسح ${variantIds.length} Order Items...`);
    await supabase.from('order_items').delete().in('variant_id', variantIds);
  }
  
  // 5. Delete products
  console.log(`⚠️ مسح المنتجات...`);
  const { error } = await supabase.from('products').delete().in('id', productIds);
  if (error) {
    console.error('❌ خطأ:', error.message);
  } else {
    console.log('✅ تم التنظيف بنجاح التام!');
  }
}

run().catch(console.error);
