const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Starting to delete all orders, order items, and transactions...");

  // Delete seller_transactions
  const { error: txError } = await supabaseAdmin
    .from('seller_transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

  if (txError) {
    console.error("Error deleting seller_transactions:", txError);
    return;
  }
  console.log("Successfully deleted all seller_transactions.");

  // Delete order_items
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); 

  if (itemsError) {
    console.error("Error deleting order_items:", itemsError);
    return;
  }
  console.log("Successfully deleted all order_items.");

  // Delete orders
  const { error: ordersError } = await supabaseAdmin
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); 

  if (ordersError) {
    console.error("Error deleting orders:", ordersError);
    return;
  }
  console.log("Successfully deleted all orders.");
  console.log("Database is clean of all orders!");
}

run();
