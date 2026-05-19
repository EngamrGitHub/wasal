import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json({ error: 'couponId is required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    // Increment used_count
    const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
    
    // Fallback if RPC doesn't exist: direct update
    if (error) {
      const { data: coupon } = await supabase.from('discounts').select('used_count').eq('id', couponId).single();
      await supabase.from('discounts').update({ used_count: (coupon?.used_count || 0) + 1 }).eq('id', couponId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
