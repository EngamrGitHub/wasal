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

const updateTranslations = async () => {
  const { data: governorates, error: fetchErr } = await supabase.from('governorates').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  const translations: Record<string, string> = {
    'Ismailia': 'الإسماعيلية',
    'Suez': 'السويس',
    '10th Of Ramadan': 'العاشر من رمضان',
    'Dakhlia': 'الدقهلية',
    'Dakahlia': 'الدقهلية',
    'Damietta': 'دمياط',
    'Ain Sokhna': 'العين السخنة',
    'Sharkya': 'الشرقية',
    'Sharqia': 'الشرقية',
    'Gharbeya': 'الغربية',
    'Gharbia': 'الغربية',
    'Qalyoubeya': 'القليوبية',
    'Qalyubia': 'القليوبية',
    'Monoufia': 'المنوفية',
    'Monufia': 'المنوفية',
    'Behira': 'البحيرة',
    'Beheira': 'البحيرة',
    'Giza (RA)': 'الجيزة (مناطق نائية)',
    'Dakhlia (RA)': 'الدقهلية (مناطق نائية)',
    'Damietta (RA)': 'دمياط (مناطق نائية)',
    'Behira (RA)': 'البحيرة (مناطق نائية)',
    'Sharkya (RA)': 'الشرقية (مناطق نائية)',
    'Gharbeya (RA)': 'الغربية (مناطق نائية)',
    'Bani Swif': 'بني سويف',
    'Beni Suef': 'بني سويف',
    'Menia': 'المنيا',
    'Minya': 'المنيا',
    'Assuit': 'أسيوط',
    'Asyut': 'أسيوط',
    'Hurghada': 'الغردقة',
    'Shrm ElSheikh': 'شرم الشيخ',
    'Marsa Matrouh': 'مرسى مطروح',
    'Red Sea (RA)': 'البحر الأحمر (مناطق نائية)',
    'Other South Sinai (RA)': 'جنوب سيناء أخرى (مناطق نائية)',
    'Helwan': 'حلوان',
    'Port Said': 'بورسعيد',
    'Cairo': 'القاهرة',
    'Giza': 'الجيزة',
    'Fayoum': 'الفيوم',
    'Sohag': 'سوهاج',
    'Qena': 'قنا',
    'Luxor': 'الأقصر',
    'Aswan': 'أسوان',
    'Alexandria': 'الإسكندرية'
  };

  for (const gov of governorates) {
    const nameEn = gov.name_en;
    const correctAr = translations[nameEn];
    
    if (correctAr && gov.name_ar !== correctAr) {
      const { error: updErr } = await supabase.from('governorates').update({ name_ar: correctAr }).eq('id', gov.id);
      if (updErr) {
        console.error('Failed to update translation for', nameEn, updErr);
      } else {
        console.log(`Updated translation for ${nameEn} -> ${correctAr}`);
      }
    }
  }
};

updateTranslations().then(() => console.log('Translations Done!'));
