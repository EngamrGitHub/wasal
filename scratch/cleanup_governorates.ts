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

const cleanupGovernorates = async () => {
  // First, rename Red Sea and South Sinai so we keep them without "RA"
  await supabase.from('governorates').update({ name_en: 'Red Sea', name_ar: 'البحر الأحمر' }).eq('id', '5959ad3d-a6f1-4945-ac1b-b93e159dd6da');
  await supabase.from('governorates').update({ name_en: 'South Sinai', name_ar: 'جنوب سيناء' }).eq('id', 'f08b3f4a-fdde-406b-8d6b-402784000b38');
  console.log('Renamed Red Sea & South Sinai.');

  // List of IDs to delete (Duplicates and RAs)
  const idsToDelete = [
    'e94253ee-e3a4-4f4e-a1dc-61df5d985663', // Dakhlia
    'b2cbd7e7-7ef0-4b39-9623-d17a824adc8b', // Sharkya
    '6d232f26-7c0c-4620-8379-f0e209131091', // Gharbeya
    '7df79b9d-f89c-4fca-a32c-2e65bf294ecd', // Qalyoubeya
    '367158bb-97a9-42ac-80ae-6fbdf4d7620e', // Monoufia
    'e9330d4c-d370-4827-a293-b3c40d07f5a7', // Behira
    '51184fa9-23bd-4c93-b0f6-be6de5983324', // Giza (RA)
    'aa98ffd7-bc23-4489-a536-11b420a9fdcc', // Dakhlia (RA)
    '7b7f7c62-e850-42e9-b635-7267f2a70189', // Damietta (RA)
    '0a054201-d3d3-45ed-a654-faa808da12ec', // Behira (RA)
    'f7b8add2-6eb0-4d85-9f93-b3852f58f692', // Sharkya (RA)
    '776574ee-d489-4986-9165-c2a244d467e4', // Gharbeya (RA)
    'bbe53ca2-27de-48bc-ada8-0e44bdf6d6f0', // Bani Swif
    'e9988a79-4c45-4119-b4f6-3865e3da6d0d', // Menia
    '9495ba77-8654-4940-8764-acf7b0aa44f7'  // Assuit
  ];

  for (const id of idsToDelete) {
    const { error: delErr } = await supabase.from('governorates').delete().eq('id', id);
    if (delErr) {
      console.error(`Failed to delete ${id}:`, delErr.message);
      // Fallback: If it's linked to an order, rename it to something that won't show or is obvious
      await supabase.from('governorates').update({ name_en: 'Deleted Area', name_ar: 'منطقة ملغية' }).eq('id', id);
    } else {
      console.log(`Deleted duplicate/RA ${id}`);
    }
  }
};

cleanupGovernorates().then(() => console.log('Cleanup Done!'));
