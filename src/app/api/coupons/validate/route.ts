import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || !orderTotal) {
      return NextResponse.json({ error: 'الكود والمبلغ مطلوبان' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    // Fetch coupon
    const { data: coupon, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'كود الخصم غير صحيح' }, { status: 404 });
    }

    // Check if active
    if (!coupon.is_active) {
      return NextResponse.json({ error: 'هذا الكود غير نشط' }, { status: 400 });
    }

    // Check dates
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ error: 'هذا الكود لم يبدأ بعد' }, { status: 400 });
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ error: 'انتهت صلاحية هذا الكود' }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'تم استنفاد الحد الأقصى لاستخدام هذا الكود' }, { status: 400 });
    }

    // Check min order value
    if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
      return NextResponse.json({ 
        error: `الحد الأدنى للطلب هو ${coupon.min_order_value} ج.م لاستخدام هذا الكود` 
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderTotal * coupon.value) / 100;
      // Apply max_discount cap if set
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.type === 'FIXED') {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalTotal: parseFloat((orderTotal - discountAmount).toFixed(2)),
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
