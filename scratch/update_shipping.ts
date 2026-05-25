import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envMap: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envMap[match[1].trim()] = match[2].trim();
});

const supabaseUrl = envMap['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseKey = envMap['SUPABASE_SERVICE_ROLE_KEY']!;

const supabase = createClient(supabaseUrl, supabaseKey);

const updateGovernorates = async () => {
  const { data: governorates, error: fetchErr } = await supabase.from('governorates').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  // Base actual prices (from Jet Express - 15%)
  // Cairo, Giza, Helwan, Alexandria, Port Said, Ismailia, Suez, 10th Of Ramadan, Dakhlia, Damietta, Ain Sokhna: 110 * 0.85 = 93.5
  // Sharkya, Gharbeya, Qalyoubeya, Monoufia: 115 * 0.85 = 97.75
  // Behira: 125 * 0.85 = 106.25
  // Bani Swif, Fayoum: 145 * 0.85 = 123.25
  // Menia, Sohag, Assuit: 150 * 0.85 = 127.5
  // Qena, Aswan, Luxor, Hurghada: 155 * 0.85 = 131.75
  // Shrm ElSheikh, Marsa Matrouh, Red Sea: 185 * 0.85 = 157.25
  // Other: 300 * 0.85 = 255
  
  // Hidden shipping cost = 50
  const hiddenCost = 50;

  const actualPrices: Record<string, number> = {
    'Cairo': 93.5, 'Giza': 93.5, 'Alexandria': 93.5, 'Port Said': 93.5, 'Ismailia': 93.5, 'Suez': 93.5, 'Dakahlia': 93.5, 'Dakhlia': 93.5, 'Damietta': 93.5, 'Helwan': 93.5, '10th Of Ramadan': 93.5, 'Ain Sokhna': 93.5,
    'Qalyubia': 97.75, 'Qalyoubeya': 97.75, 'Sharqia': 97.75, 'Sharkya': 97.75, 'Gharbia': 97.75, 'Gharbeya': 97.75, 'Monufia': 97.75, 'Monoufia': 97.75,
    'Beheira': 106.25, 'Behira': 106.25,
    'Giza (RA)': 119, 'Dakhlia (RA)': 119, 'Damietta (RA)': 119, 'Behira (RA)': 119, 'Sharkya (RA)': 119, 'Gharbeya (RA)': 119,
    'Fayoum': 123.25, 'Beni Suef': 123.25, 'Bani Swif': 123.25,
    'Minya': 127.5, 'Menia': 127.5, 'Sohag': 127.5, 'Asyut': 127.5, 'Assuit': 127.5,
    'Qena': 131.75, 'Aswan': 131.75, 'Luxor': 131.75, 'Hurghada': 131.75,
    'Shrm ElSheikh': 157.25, 'Marsa Matrouh': 157.25, 'Red Sea (RA)': 157.25,
    'Other South Sinai (RA)': 255
  };

  for (const gov of governorates) {
    const nameEn = gov.name_en;
    
    // Default to 255 (Other) if not found in map
    let actualPrice = actualPrices[nameEn];
    if (actualPrice === undefined) {
       actualPrice = 255;
    }

    // Set normal shipping cost = Math.ceil(actual - hiddenCost)
    const normalShipping = Math.max(0, Math.ceil(actualPrice - hiddenCost));
    
    const { error: updErr } = await supabase.from('governorates').update({ shipping_price: normalShipping }).eq('id', gov.id);
    if (updErr) {
      console.error('Failed to update', nameEn, updErr);
    } else {
      console.log(`Updated ${nameEn} -> Actual: ${actualPrice}, Normal: ${normalShipping}`);
    }
  }
};

updateGovernorates().then(() => console.log('Done!'));
