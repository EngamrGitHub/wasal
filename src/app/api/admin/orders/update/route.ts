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
      console.warn('Unauthorized admin orders update API access attempt:', {
        hasUser: !!user,
        email: user?.email,
        role: user?.user_metadata?.role
      });
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

      // Restore stock for deleted item
      if (item.variant_id) {
        const { data: vData } = await supabaseAdmin.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
        if (vData) {
          await supabaseAdmin.from('product_variants').update({ stock_quantity: vData.stock_quantity + item.quantity }).eq('id', item.variant_id);
        }
      }
    }

    // 5. Update changed items (quantity, variant, and commission recalculation)
    for (const item of tempItems) {
      const original = originalItems.find(o => o.id === item.id);
      if (original && (original.quantity !== item.quantity || original.variant_id !== item.variant_id)) {
        
        // Stock adjustment logic
        if (original.variant_id === item.variant_id) {
          // Same variant, quantity changed
          const diff = item.quantity - original.quantity;
          if (diff !== 0 && item.variant_id) {
            const { data: vData } = await supabaseAdmin.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
            if (vData) {
              await supabaseAdmin.from('product_variants').update({ stock_quantity: Math.max(0, vData.stock_quantity - diff) }).eq('id', item.variant_id);
            }
          }
        } else {
          // Variant changed: Restore original, deduct from new
          if (original.variant_id) {
            const { data: oldV } = await supabaseAdmin.from('product_variants').select('stock_quantity').eq('id', original.variant_id).single();
            if (oldV) {
               await supabaseAdmin.from('product_variants').update({ stock_quantity: oldV.stock_quantity + original.quantity }).eq('id', original.variant_id);
            }
          }
          if (item.variant_id) {
            const { data: newV } = await supabaseAdmin.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
            if (newV) {
               await supabaseAdmin.from('product_variants').update({ stock_quantity: Math.max(0, newV.stock_quantity - item.quantity) }).eq('id', item.variant_id);
            }
          }
        }

        const singleCommission = (original.commission_amount || 0) / original.quantity;
        const newCommission = singleCommission * item.quantity;

        const { error: updErr } = await supabaseAdmin
          .from('order_items')
          .update({ 
            quantity: item.quantity,
            commission_amount: newCommission,
            variant_id: item.variant_id
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
