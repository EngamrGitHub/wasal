import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Service Role key to bypass RLS and avoid infinite recursion
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { 
      customerName, 
      phone, 
      address, 
      governorateId, 
      items, // Array of { productId, variantId, quantity }
      couponCode,
      guestId = 'de000000-0000-0000-0000-000000000000'
    } = body;

    if (!customerName || !phone || !address || !governorateId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    // 1. Upsert profile for guest
    await supabase.from('profiles').upsert({
      id: guestId,
      full_name: customerName,
      phone: phone
    });

    // 2. Fetch all product details
    const productIds = Array.from(new Set(items.map((i: any) => i.productId)));
    const { data: productsData, error: productError } = await supabase
      .from('products')
      .select('*, product_variants(*), stores(commission_rate)')
      .in('id', productIds);

    if (productError || !productsData || productsData.length === 0) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 404 });
    }

    const productsMap: Record<string, any> = {};
    productsData.forEach(p => { productsMap[p.id] = p; });

    // 3. Group items by store_id
    const storeGroups: Record<string, { storeId: string; items: any[]; subtotal: number; commissionRate: number }> = {};
    
    let totalOrderValue = 0; // for calculating proportional discount

    for (const item of items) {
      const product = productsMap[item.productId];
      if (!product) continue;
      
      const variant = product.product_variants.find((v: any) => v.id === item.variantId) || product.product_variants[0];
      if (!variant) continue;

      const storeId = product.store_id || 'platform'; // 'platform' means Wesal's own inventory
      
      if (!storeGroups[storeId]) {
        storeGroups[storeId] = {
          storeId,
          items: [],
          subtotal: 0,
          commissionRate: product.stores?.commission_rate ? Number(product.stores.commission_rate) : 10
        };
      }

      // Apply smart pricing markup: ceil((Original Price * 1.25) + 50)
      const basePrice = Number(variant.price || 0);
      const price = Math.ceil(basePrice * 1.25 + 50);
      const subtotal = price * item.quantity;
      
      storeGroups[storeId].items.push({
        ...item,
        product,
        variant,
        price,
        subtotal
      });
      
      storeGroups[storeId].subtotal += subtotal;
      totalOrderValue += subtotal;
    }

    // 4. Validate Coupon and get Global Discount logic
    let totalDiscountAmount = 0;
    let appliedCouponId = null;
    let couponType = '';
    let couponValue = 0;

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();
        
      if (coupon) {
         appliedCouponId = coupon.id;
         couponType = coupon.type;
         couponValue = Number(coupon.value);
         
         if (couponType === 'PERCENTAGE') {
            totalDiscountAmount = totalOrderValue * (couponValue / 100);
         } else if (couponType === 'FIXED') {
            totalDiscountAmount = couponValue;
         }
      }
    }

    // 5. Create distinct orders for each store group
    const createdOrders = [];

    for (const [storeId, group] of Object.entries(storeGroups)) {
      
      // Calculate Shipping for this specific store
      let shippingPrice = 45; // Default fallback
      if (storeId !== 'platform') {
        const { data: quoteData } = await supabase.rpc("resolve_store_shipping_price", {
          p_store_id: storeId,
          p_governorate_id: governorateId,
        });
        if (quoteData !== null) {
          shippingPrice = Number(quoteData);
        }
      } else {
         const { data: gov } = await supabase.from('governorates').select('shipping_price').eq('id', governorateId).single();
         if (gov) shippingPrice = Number(gov.shipping_price || 0);
      }

      // Calculate Commission for this store (Total of all items)
      // Note: We apply commission on the subtotal. 
      // If your business rule says commission is after discount, adjust here.
      const storeCommission = (group.subtotal * group.commissionRate) / 100;

      // Distribute discount proportionally based on this store's share of the total subtotal
      let storeDiscountAmount = 0;
      if (totalDiscountAmount > 0 && totalOrderValue > 0) {
        storeDiscountAmount = (group.subtotal / totalOrderValue) * totalDiscountAmount;
      }

      const finalPrice = group.subtotal + shippingPrice - storeDiscountAmount;

      // Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: guestId,
          governorate_id: governorateId,
          products_total: group.subtotal,
          commission_total: storeCommission,
          fixed_shipping_price: shippingPrice,
          actual_shipping_cost: shippingPrice,
          discount_id: appliedCouponId,
          discount_amount: storeDiscountAmount,
          final_price: finalPrice,
          status: 'PENDING',
          shipping_address: {
            name: customerName,
            address: address,
            phone: phone
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;
      createdOrders.push(orderData);

      // Insert Order Items
      for (const item of group.items) {
        // Commission per item proportional
        const itemCommission = (item.subtotal * group.commissionRate) / 100;

        await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            variant_id: item.variant.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.subtotal,
            commission_amount: itemCommission
          });
      }

      // Create Seller Transaction if it's a real merchant store
      if (storeId !== 'platform') {
         await supabase.from('seller_transactions').insert({
            seller_id: storeId,
            order_id: orderData.id,
            amount: group.subtotal - storeCommission, // Merchant earns subtotal minus platform commission
            status: 'PENDING'
         });
      }
    }

    return NextResponse.json({ success: true, orders: createdOrders });
  } catch (error: any) {
    console.error("Multi-Order Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
