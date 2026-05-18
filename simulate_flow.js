const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvuosxwngltobuobhkwb.supabase.co';
const supabaseKey = 'sb_publishable_u1M2gSV2wtCnggxW6BpBjg_4XlvvsK-';
// Note: Normally we need the SERVICE_ROLE_KEY to bypass RLS and create test data easily.
// Let's assume we can insert using the anon key if RLS allows, otherwise we might get RLS errors.
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTestFlow() {
  try {
    console.log('1. Fetching a category...');
    const { data: category } = await supabase.from('categories').select('id').limit(1).single();
    const categoryId = category ? category.id : null;

    console.log('2. Creating a Product (Merchant simulation)...');
    const { data: product, error: prodErr } = await supabase.from('products').insert({
      name_ar: 'تيشيرت تجريبي E2E',
      name_en: 'E2E Test T-Shirt',
      description_ar: 'هذا منتج تم إنشاؤه بواسطة السكربت',
      description_en: 'Created by E2E script',
      category_id: categoryId,
      approval_status: 'APPROVED', // Auto-approve for test
      is_active: true
    }).select().single();
    if (prodErr) throw prodErr;

    console.log('3. Creating Product Variant...');
    const merchantPrice = 200; // The price the merchant wants
    const { data: variant, error: varErr } = await supabase.from('product_variants').insert({
      product_id: product.id,
      sku: `TEST-${Date.now()}`,
      price: merchantPrice,
      stock_quantity: 50,
      weight_kg: 0.5,
      is_active: true
    }).select().single();
    if (varErr) throw varErr;

    console.log(`Merchant created product successfully. Variant ID: ${variant.id}, Merchant Price: ${merchantPrice} EGP`);

    console.log('4. Simulating Customer Checkout Flow...');
    
    // Simulate what the frontend does
    const platformCommission = 50; // Admin profit per item
    const customerShipping = 40; // Fixed shipping shown to customer
    const actualShipping = 60; // Real shipping cost from company
    const shippingDifference = actualShipping - customerShipping; // 20 EGP absorbed
    
    const customerItemPrice = merchantPrice + platformCommission + shippingDifference; // 200 + 50 + 20 = 270 EGP
    const quantity = 2;
    
    const productsTotal = customerItemPrice * quantity; // 540 EGP
    const finalPrice = productsTotal + customerShipping; // 540 + 40 = 580 EGP
    const totalCommission = platformCommission * quantity; // 100 EGP

    console.log('5. Inserting Order into Database...');
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      products_total: productsTotal,
      commission_total: totalCommission,
      fixed_shipping_price: customerShipping,
      actual_shipping_cost: actualShipping,
      final_price: finalPrice,
      status: 'PENDING'
    }).select().single();
    if (orderErr) throw orderErr;

    const { error: itemErr } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      quantity: quantity,
      unit_price: customerItemPrice,
      total_price: productsTotal,
      commission_amount: totalCommission
    });
    if (itemErr) throw itemErr;

    console.log('\n✅ ==================================== ✅');
    console.log('🎉 E2E TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('========================================');
    console.log(`📦 Order ID: ${order.id}`);
    console.log(`👕 Customer bought: ${quantity}x T-Shirts`);
    console.log(`💰 Customer Paid (Item Price): ${customerItemPrice} EGP x ${quantity} = ${productsTotal} EGP`);
    console.log(`🚚 Customer Paid (Shipping): ${customerShipping} EGP`);
    console.log(`🧾 Final Order Total Paid by Customer: ${finalPrice} EGP`);
    console.log('----------------------------------------');
    console.log('💵 FINANCIAL BREAKDOWN:');
    console.log(`🧑‍💼 Merchant Receives: ${merchantPrice * quantity} EGP`);
    console.log(`🏢 Platform Commission (Your Net Profit): ${totalCommission} EGP`);
    console.log(`🚚 Shipping Company Receives: ${actualShipping} EGP`);
    console.log('========================================\n');

  } catch (err) {
    console.error('Test Failed:', err.message || err);
  }
}

runTestFlow();
