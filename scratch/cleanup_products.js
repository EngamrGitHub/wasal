const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('🔄 جاري تنظيف المنتجات اللي ملهاش متجر...');
  
  // Get all valid stores
  const { data: stores } = await supabase.from('stores').select('id');
  const validStoreIds = stores.map(s => s.id);
  
  if (validStoreIds.length === 0) {
    console.log('⚠️ لا يوجد متاجر! إذا قمت بمسح المنتجات الآن سيتم مسحها بالكامل.');
    return;
  }
  
  console.log(`المتاجر المتاحة: ${validStoreIds.length}`);
  
  // Delete all products where store_id is NOT in validStoreIds
  const { data: deleted, error } = await supabase
    .from('products')
    .delete()
    .not('store_id', 'in', `(${validStoreIds.join(',')})`)
    .select('id, name_ar');
    
  if (error) {
    console.error('❌ خطأ في المسح:', error.message);
  } else {
    console.log(`✅ تم مسح ${deleted.length} منتجات مالهاش متجر صالح في الداتا بيز.`);
    deleted.forEach(p => console.log(` - ${p.name_ar} (ID: ${p.id})`));
  }
  
  // Also check products with NULL store_id
  const { data: deletedNull, error: errNull } = await supabase
    .from('products')
    .delete()
    .is('store_id', null)
    .select('id, name_ar');
    
  if (errNull) {
    console.error('❌ خطأ في مسح المنتجات بدون متجر:', errNull.message);
  } else {
    console.log(`✅ تم مسح ${deletedNull.length} منتجات الـ store_id بتاعها NULL.`);
    deletedNull.forEach(p => console.log(` - ${p.name_ar} (ID: ${p.id})`));
  }
}

run().catch(console.error);
