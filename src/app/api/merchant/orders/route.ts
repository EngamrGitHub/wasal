import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/src/lib/supabase/server'

export async function GET() {
  try {
    // 1. Initialize the standard Supabase server client which handles cookies and sessions correctly
    const supabaseAuth = await createClient();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Supabase URL/Key not set' }, { status: 500 });
    }

    // 2. Verify authenticated user is a MERCHANT
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || user.user_metadata?.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.user_metadata?.store_id;
    if (!storeId) {
      return NextResponse.json([]);
    }

    // 3. Connect to Supabase using the service role key to bypass all RLS policies for sizes/colors tables
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select(`
        *,
        orders(*),
        products!inner(*, product_images(*)),
        variant:product_variants(*, colors(*), sizes(*))
      `)
      .eq('products.store_id', storeId)
      .order('id', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('API Error fetching merchant orders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
