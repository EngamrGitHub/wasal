const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  // Find Ahmed and Amr
  const ahmed = users.find(u => u.email === 'ahmed@gmail.com');
  const amr = users.find(u => u.email === 'amr232948@gmail.com');

  const oldStoreId = 'c72919d9-ec29-4a7d-91e1-239a7c27228e';
  const ahmedStoreId = ahmed.user_metadata.store_id;

  console.log("Ahmed's New Store ID:", ahmedStoreId);

  // 1. Move all products from old store to Ahmed's store
  const { data: updatedProducts, error: updateProductsError } = await supabaseAdmin
    .from('products')
    .update({ store_id: ahmedStoreId })
    .eq('store_id', oldStoreId)
    .select();

  if (updateProductsError) {
    console.error("Error updating products:", updateProductsError);
  } else {
    console.log(`Successfully moved ${updatedProducts.length} products to Ahmed's store.`);
  }

  // 2. Explicitly nullify Amr's store details in user_metadata
  const updatedAmrMetadata = { 
    ...amr.user_metadata,
    role: 'ADMIN',
    store_id: null,
    store_name_ar: null,
    store_name_en: null,
    commission_rate: null
  };

  const { error: updateAmrError } = await supabaseAdmin.auth.admin.updateUserById(amr.id, {
    user_metadata: updatedAmrMetadata
  });

  if (updateAmrError) {
    console.error("Error updating Amr metadata:", updateAmrError);
  } else {
    console.log("Successfully removed store_id from Amr's metadata.");
  }

  // 3. Delete the old ghost store to prevent future confusion
  const { error: deleteStoreError } = await supabaseAdmin
    .from('stores')
    .delete()
    .eq('id', oldStoreId);

  if (deleteStoreError) {
    console.error("Error deleting old store:", deleteStoreError);
  } else {
    console.log("Successfully deleted old ghost store.");
  }
}

run();
