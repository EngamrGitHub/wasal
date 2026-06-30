const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('⚡ Checking Supabase connectivity...');
  
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

  console.log('Supabase URL:', url);
  
  const supabase = createClient(url, key);

  const start = Date.now();
  try {
    console.log('Fetching categories...');
    const { data, error } = await supabase.from('categories').select('*');
    const elapsed = Date.now() - start;
    if (error) {
      console.error('❌ Error fetching categories:', error);
    } else {
      console.log(`✅ Fetched ${data.length} categories in ${elapsed}ms:`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Threw exception:', err);
  }

  const start2 = Date.now();
  try {
    console.log('Fetching products...');
    const { data, error } = await supabase.from('products').select('id, name_en, approval_status');
    const elapsed = Date.now() - start2;
    if (error) {
      console.error('❌ Error fetching products:', error);
    } else {
      console.log(`✅ Fetched ${data.length} products in ${elapsed}ms.`);
    }
  } catch (err) {
    console.error('❌ Threw exception:', err);
  }
})();
