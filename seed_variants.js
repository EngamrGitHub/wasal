const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvuosxwngltobuobhkwb.supabase.co';
const supabaseKey = 'sb_publishable_u1M2gSV2wtCnggxW6BpBjg_4XlvvsK-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Checking Colors...');
  const { data: colors, error: colorErr } = await supabase.from('colors').select('*');
  if (colorErr) console.error(colorErr);
  
  if (!colors || colors.length === 0) {
    console.log('Inserting basic colors...');
    await supabase.from('colors').insert([
      { name: 'أسود (Black)', hex_code: '#000000' },
      { name: 'أبيض (White)', hex_code: '#FFFFFF' },
      { name: 'أحمر (Red)', hex_code: '#FF0000' },
      { name: 'أزرق (Blue)', hex_code: '#0000FF' }
    ]);
  }

  console.log('Checking Size Types and Sizes...');
  const { data: types, error: typeErr } = await supabase.from('size_types').select('*');
  if (typeErr) console.error(typeErr);

  let typeId;
  if (!types || types.length === 0) {
    const { data: newType } = await supabase.from('size_types').insert([{ name: 'Clothing (ملابس)' }]).select();
    if (newType && newType.length > 0) {
      typeId = newType[0].id;
    }
  } else {
    typeId = types[0].id;
  }

  const { data: sizes, error: sizeErr } = await supabase.from('sizes').select('*');
  if (sizeErr) console.error(sizeErr);

  if (!sizes || sizes.length === 0) {
    console.log('Inserting basic sizes...');
    await supabase.from('sizes').insert([
      { name: 'S', size_type_id: typeId },
      { name: 'M', size_type_id: typeId },
      { name: 'L', size_type_id: typeId },
      { name: 'XL', size_type_id: typeId },
      { name: 'XXL', size_type_id: typeId }
    ]);
  }

  console.log('Done seeding variants!');
}

seed();
