import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // 1. Initialize the standard Supabase server client
    const supabaseAuth = await createClient();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Supabase URL/Key not set' }, { status: 500 });
    }

    // 2. Verify authenticated user is an ADMIN
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || user.user_metadata?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, tempItems, shippingPrice } = await req.json();
    if (!orderId || !tempItems) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 3. Initialize admin service role client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch original order_items for safety check
    const { data: originalItems, error: origError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (origError) throw origError;

    // 4. Identify and delete items that are no longer in the order
    const deletedItems = originalItems.filter(
      orig => !tempItems.some((temp: any) => temp.id === orig.id)
    );

    for (const item of deletedItems) {
      const { error: delErr } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('id', item.id);
      if (delErr) throw delErr;
    }

    // 5. Update changed items (quantity and commission recalculation)
    for (const item of tempItems) {
      const original = originalItems.find(o => o.id === item.id);
      if (original && original.quantity !== item.quantity) {
        const singleCommission = (original.commission_amount || 0) / original.quantity;
        const newCommission = singleCommission * item.quantity;

        const { error: updErr } = await supabaseAdmin
          .from('order_items')
          .update({ 
            quantity: item.quantity,
            commission_amount: newCommission
          })
          .eq('id', item.id);
        if (updErr) throw updErr;
      }
    }

    // 6. Recalculate totals
    const newSubtotal = tempItems.reduce((acc: number, item: any) => {
      const price = item.price_at_time || item.unit_price || 0;
      return acc + (price * item.quantity);
    }, 0);
    
    const newFinalPrice = newSubtotal + Number(shippingPrice || 0);

    // 7. Update orders table
    const { error: orderErr } = await supabaseAdmin
      .from('orders')
      .update({
        products_total: newSubtotal,
        final_price: newFinalPrice
      })
      .eq('id', orderId);

    if (orderErr) throw orderErr;

    return NextResponse.json({ success: true, products_total: newSubtotal, final_price: newFinalPrice });
  } catch (err: any) {
    console.error('API Error in admin orders update POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
