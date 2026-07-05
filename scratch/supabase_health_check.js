const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runHealthCheck() {
  console.log('🔄 جاري فحص حالة قاعدة بيانات Supabase...\n');
  let isHealthy = true;

  // 1. Check Stores
  try {
    const { data, error } = await supabase.from('stores').select('id').limit(1);
    if (error) throw error;
    console.log('✅ جدول المتاجر (stores): شغال تمام.');
  } catch (e) {
    console.error('❌ مشكلة في جدول stores:', e.message);
    isHealthy = false;
  }

  // 2. Check Products
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error) throw error;
    console.log('✅ جدول المنتجات (products): شغال تمام.');
  } catch (e) {
    console.error('❌ مشكلة في جدول products:', e.message);
    isHealthy = false;
  }

  // 3. Check Product Variants
  try {
    const { data, error } = await supabase.from('product_variants').select('id').limit(1);
    if (error) throw error;
    console.log('✅ جدول المتغيرات (product_variants): شغال تمام.');
  } catch (e) {
    console.error('❌ مشكلة في جدول product_variants:', e.message);
    isHealthy = false;
  }

  // 4. Check Categories
  try {
    const { data, error } = await supabase.from('categories').select('id').limit(1);
    if (error) throw error;
    console.log('✅ جدول الأقسام (categories): شغال تمام.');
  } catch (e) {
    console.error('❌ مشكلة في جدول categories:', e.message);
    isHealthy = false;
  }

  // 5. Check Auth/Users
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log(`✅ نظام المصادقة والمستخدمين (Auth): شغال تمام (يوجد ${users.length} مستخدمين).`);
  } catch (e) {
    console.error('❌ مشكلة في نظام المستخدمين (Auth):', e.message);
    isHealthy = false;
  }

  console.log('\n=======================================');
  if (isHealthy) {
    console.log('🎉 النتيجة النهائية: Supabase شغال بشكل ممتاز ومفيش أي مشاكل في الجداول الأساسية!');
  } else {
    console.log('⚠️ النتيجة النهائية: في بعض المشاكل في قاعدة البيانات محتاجة تتراجع.');
  }
}

runHealthCheck().catch(console.error);
