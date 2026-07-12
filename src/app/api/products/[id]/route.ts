import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Deterministic fake data generator (same as productService.ts)
function getFakeProductData(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) & 0x7fffffff;
  }
  const rating = parseFloat((4.1 + (hash % 8) * 0.1).toFixed(1));
  const reviews = 47 + (hash % 290);
  const discountPct = 15 + (hash % 26);
  return { rating, reviews, discountPct };
}

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

    // Apply smart pricing + fake social proof
    if (productData) {
      const fakeData = getFakeProductData(productData.id);
      productData.fake_rating = fakeData.rating;
      productData.fake_reviews = fakeData.reviews;
      productData.fake_discount_pct = fakeData.discountPct;

      if (productData.product_variants) {
        productData.product_variants.forEach((variant: any) => {
          variant.original_price = variant.price;
          // The price is already marked up by the admin during approval
          const finalPrice = variant.price;
          variant.price = finalPrice;
          variant.fake_original_price = Math.ceil(finalPrice * (1 + fakeData.discountPct / 100));
        });
      }
    }

    return NextResponse.json(productData);
  } catch (err: any) {
    console.error('Error fetching product details via admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
