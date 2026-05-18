const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvuosxwngltobuobhkwb.supabase.co';
const supabaseKey = 'sb_publishable_u1M2gSV2wtCnggxW6BpBjg_4XlvvsK-';
const supabase = createClient(supabaseUrl, supabaseKey);

const zones = [
  {
    name: "Zone 1",
    base_price: 110,
    add_kg_price: 35,
    governorates: ["Cairo", "Giza", "Helwan", "Alexandria", "Port Said", "Ismailia", "Suez", "10th Of Ramadan", "Dakhlia", "Damietta", "Ain Sokhna"]
  },
  {
    name: "Zone 2",
    base_price: 115,
    add_kg_price: 35,
    governorates: ["Sharkya", "Gharbeya", "Qalyoubeya", "Monoufia"]
  },
  {
    name: "Zone 3",
    base_price: 125,
    add_kg_price: 35,
    governorates: ["Behira"]
  },
  {
    name: "Zone 4",
    base_price: 140,
    add_kg_price: 35,
    governorates: ["Giza (RA)", "Dakhlia (RA)", "Damietta (RA)", "Behira (RA)", "Sharkya (RA)", "Gharbeya (RA)"]
  },
  {
    name: "Zone 5",
    base_price: 145,
    add_kg_price: 40,
    governorates: ["Bani Swif", "Fayoum"]
  },
  {
    name: "Zone 6",
    base_price: 150,
    add_kg_price: 40,
    governorates: ["Menia", "Sohag", "Assuit"]
  },
  {
    name: "Zone 7",
    base_price: 155,
    add_kg_price: 45,
    governorates: ["Qena", "Aswan", "Luxor", "Hurghada"]
  },
  {
    name: "Zone 8",
    base_price: 185,
    add_kg_price: 70,
    governorates: ["Shrm ElSheikh", "Marsa Matrouh", "Red Sea (RA)"]
  },
  {
    name: "Zone 9",
    base_price: 300,
    add_kg_price: 95,
    governorates: ["Other South Sinai (RA)"]
  }
];

async function seedJetExpress() {
  try {
    console.log('Seeding Shipping Provider...');
    let { data: provider } = await supabase.from('shipping_providers').select('*').eq('name', 'Jet Express').single();
    
    if (!provider) {
      const res = await supabase.from('shipping_providers').insert({ name: 'Jet Express', is_active: true }).select().single();
      provider = res.data;
    }

    console.log('Seeding Governorates and Rates...');
    for (const zone of zones) {
      for (const govName of zone.governorates) {
        // Create Governorate
        let { data: gov } = await supabase.from('governorates').select('*').eq('name_en', govName).single();
        if (!gov) {
          const res = await supabase.from('governorates').insert({
            name_en: govName,
            name_ar: govName, // Using EN for AR since we don't have translations right now
            shipping_price: zone.base_price, // Fallback simple price
            is_active: true
          }).select().single();
          gov = res.data;
        }

        if (!gov) continue;

        // Create Shipping Rates based on weights (1 to 5 KG)
        for (let weight = 1; weight <= 5; weight++) {
          let price = zone.base_price;
          if (weight > 1) {
            price += (weight - 1) * zone.add_kg_price;
          }
          
          await supabase.from('shipping_rates').upsert({
            provider_id: provider.id,
            governorate_id: gov.id,
            weight_kg: weight,
            price: price
          }, { onConflict: 'provider_id,governorate_id,weight_kg' });
        }
      }
    }
    console.log('Jet Express Shipping Rates seeded successfully!');
  } catch (err) {
    console.error('Error seeding shipping rates:', err.message);
  }
}

seedJetExpress();
