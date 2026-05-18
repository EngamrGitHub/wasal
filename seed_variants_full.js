const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local manually
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvuosxwngltobuobhkwb.supabase.co';
// Use the service role key if available to bypass RLS, otherwise fallback to public key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_u1M2gSV2wtCnggxW6BpBjg_4XlvvsK-';

console.log('Using Supabase URL:', supabaseUrl);
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔑 Service Role Key detected! RLS will be bypassed.');
} else {
  console.log('⚠️ Public Anon Key being used. Seeding might fail if RLS is enabled.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = [
  { name: 'أسود (Black)', hex_code: '#000000' },
  { name: 'أبيض (White)', hex_code: '#FFFFFF' },
  { name: 'أحمر (Red)', hex_code: '#FF0000' },
  { name: 'أزرق (Blue)', hex_code: '#0000FF' },
  { name: 'أخضر (Green)', hex_code: '#008000' },
  { name: 'أصفر (Yellow)', hex_code: '#FFFF00' },
  { name: 'رمادي (Grey)', hex_code: '#808080' },
  { name: 'بني (Brown)', hex_code: '#A52A2A' },
  { name: 'برتقالي (Orange)', hex_code: '#FFA500' },
  { name: 'وردي (Pink)', hex_code: '#FFC0CB' },
  { name: 'بنفسجي (Purple)', hex_code: '#800080' },
  { name: 'كحلي (Navy)', hex_code: '#000080' },
  { name: 'بيج (Beige)', hex_code: '#F5F5DC' }
];

const sizeTypesData = [
  {
    name: 'ملابس (Clothing)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
  },
  {
    name: 'أحذية (Shoes)',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
  },
  {
    name: 'مقاس واحد (One Size)',
    sizes: ['Free Size']
  }
];

async function seedFullVariants() {
  try {
    console.log('Seeding Colors...');
    for (const color of colors) {
      const { data } = await supabase.from('colors').select('id').eq('name', color.name).single();
      if (!data) {
        await supabase.from('colors').insert(color);
      }
    }

    console.log('Seeding Size Types and Sizes...');
    for (const typeData of sizeTypesData) {
      let { data: sizeType } = await supabase.from('size_types').select('id').eq('name', typeData.name).single();
      if (!sizeType) {
        const res = await supabase.from('size_types').insert({ name: typeData.name }).select('id').single();
        sizeType = res.data;
      }

      if (sizeType) {
        for (const sizeName of typeData.sizes) {
          const { data: sizeObj } = await supabase.from('sizes').select('id').eq('name', sizeName).eq('size_type_id', sizeType.id).single();
          if (!sizeObj) {
            await supabase.from('sizes').insert({ name: sizeName, size_type_id: sizeType.id });
          }
        }
      }
    }

    console.log('Full Variants seeded successfully!');
  } catch (err) {
    console.error('Error seeding full variants:', err);
  }
}

seedFullVariants();
