import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { variantId, quantity } = await req.json();
    if (!variantId || !quantity) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch current variant stock safely bypassing RLS
    const { data: variant, error: fetchErr } = await supabaseAdmin
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (fetchErr || !variant) {
      console.error('Error fetching variant to decrement:', fetchErr);
      return NextResponse.json({ success: true, warning: 'Variant not found' }); // Don't block the checkout
    }

    const newStock = Math.max(0, variant.stock_quantity - quantity);

    const { error: updateErr } = await supabaseAdmin
      .from('product_variants')
      .update({ stock_quantity: newStock })
      .eq('id', variantId);

    if (updateErr) {
      console.error('Error updating stock:', updateErr);
      return NextResponse.json({ success: true, warning: 'Failed to update stock' });
    }

    return NextResponse.json({ success: true, newStock });
  } catch (err: any) {
    console.error('Decrement stock error:', err);
    return NextResponse.json({ success: true, error: err.message }); // Don't block order
  }
}
