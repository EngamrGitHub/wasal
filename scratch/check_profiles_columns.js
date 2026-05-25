const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('profiles').insert({
    id: 'de000000-0000-0000-0000-000000000000', // Guest ID
    full_name: 'Test Profile',
    phone: '12345678'
  }).select();

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted profile row keys:', Object.keys(data[0]));
    // Clean up
    await supabase.from('profiles').delete().eq('id', 'de000000-0000-0000-0000-000000000000');
  }
}

check();
