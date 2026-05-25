const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...val] = trimmed.split('=');
    if (key) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*, colors(*), sizes(*)')
    .limit(10);
  
  console.log('Variants count:', variants?.length, error || 'No error');
  if (variants && variants.length > 0) {
    console.log('Sample variants:', JSON.stringify(variants.slice(0, 3), null, 2));
  }
}

check();
