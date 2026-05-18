import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use the service role key on the server side to bypass RLS
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  try {
    const [catsRes, colorsRes, sizeTypesRes, sizesRes] = await Promise.all([
      supabase.from('categories').select('id, name_en, name_ar'),
      supabase.from('colors').select('id, name, hex_code'),
      supabase.from('size_types').select('id, name'),
      supabase.from('sizes').select('id, name, size_type_id')
    ]);

    const error = catsRes.error || colorsRes.error || sizeTypesRes.error || sizesRes.error;
    if (error) {
      console.error('Supabase fetch error in reference route:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      categories: catsRes.data || [],
      colors: colorsRes.data || [],
      sizeTypes: sizeTypesRes.data || [],
      sizes: sizesRes.data || []
    });
  } catch (err: any) {
    console.error('Server error in reference route:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
