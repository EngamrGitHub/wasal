import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .select('*, product_variants(*, colors(*), sizes(*)), product_images(*)')
      .eq('id', id)
      .single();

    if (productError) throw productError;

    // Apply smart pricing logic for the public storefront: 
    // Final Price = ceil((Original Price * 1.25) + 50)
    if (productData && productData.product_variants) {
      productData.product_variants.forEach((variant: any) => {
        variant.original_price = variant.price;
        variant.price = Math.ceil(variant.price * 1.25 + 50);
      });
    }

    return NextResponse.json(productData);
  } catch (err: any) {
    console.error('Error fetching product details via admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
