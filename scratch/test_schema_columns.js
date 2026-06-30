const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  let url = 'https://uvuosxwngltobuobhkwb.supabase.co';
  let key = '';

  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/); // USING SERVICE ROLE!
    if (urlMatch) url = urlMatch[1].trim();
    if (keyMatch) key = keyMatch[1].trim();
  } catch (e) {}

  const supabase = createClient(url, key); // Bypasses RLS

  try {
    console.log('Checking orders table schema...');
    
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
       console.error('Error:', error);
    } else {
       if (data.length > 0) {
          console.log('Orders columns:', Object.keys(data[0]));
       } else {
          console.log('No orders found, inserting a dummy order and rolling back...');
       }
    }

  } catch (err) {
    console.error('Exception occurred:', err);
  }
})();
