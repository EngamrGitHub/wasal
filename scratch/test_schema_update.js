const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('⚡ Checking if new schema tables exist...');
  
  let url = 'https://uvuosxwngltobuobhkwb.supabase.co';
  let key = '';

  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    if (urlMatch) url = urlMatch[1].trim();
    if (keyMatch) key = keyMatch[1].trim();
  } catch (e) {
    console.log('Could not read env file, using default credentials');
  }
  
  const supabase = createClient(url, key);

  try {
    console.log('Fetching stores table...');
    const { data: stores, error: storeError } = await supabase.from('stores').select('*').limit(1);
    
    if (storeError) {
      console.error('❌ Error fetching stores. It seems the SQL migration was not fully applied yet:', storeError.message);
      return;
    }
    
    console.log('✅ Success! The `stores` table exists.');
    console.log('Fetching shipping rates table...');
    
    const { data: rates, error: rateError } = await supabase.from('store_shipping_rates').select('*').limit(1);
    
    if (rateError) {
      console.error('❌ Error fetching store_shipping_rates:', rateError.message);
      return;
    }
    
    console.log('✅ Success! The `store_shipping_rates` table exists.');
    
    console.log('\n🎉 SQL Migration is fully applied! The new shipping and commission logic is ready to be tested from the frontend.');
    
  } catch (err) {
    console.error('Exception occurred:', err);
  }
})();
