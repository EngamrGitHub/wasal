const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  let url = 'https://uvuosxwngltobuobhkwb.supabase.co';
  let key = '';

  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    if (urlMatch) url = urlMatch[1].trim();
    if (keyMatch) key = keyMatch[1].trim();
  } catch (e) {}

  const supabase = createClient(url, key); 

  try {
    console.log('Fetching orders with ANON KEY to ensure no infinite recursion...');
    
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
       console.error('❌ Error:', error);
    } else {
       console.log('✅ Success! Infinite recursion is fixed. Data:', data.length, 'rows');
    }

  } catch (err) {
    console.error('Exception occurred:', err);
  }
})();
