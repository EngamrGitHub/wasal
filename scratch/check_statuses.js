const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: all } = await supabase.from('products').select('id, name_ar, approval_status, store_id');
  
  console.log(`عدد المنتجات الكلي في الداتا بيز: ${all.length}`);
  
  const pending = all.filter(p => p.approval_status === 'PENDING');
  console.log(`عدد المنتجات الـ PENDING: ${pending.length}`);
  
  const approved = all.filter(p => p.approval_status === 'APPROVED');
  console.log(`عدد المنتجات الـ APPROVED: ${approved.length}`);
  
  console.log('\n--- حالة المنتجات ---');
  all.forEach(p => console.log(`- ${p.name_ar} (Status: ${p.approval_status})`));
}
run().catch(console.error);
