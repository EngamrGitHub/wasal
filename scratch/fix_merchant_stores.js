const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Fetching users...");
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  // Find ahmed
  const ahmed = users.find(u => u.email === 'ahmed@gmail.com');
  if (!ahmed) {
    console.log("Ahmed not found!");
    return;
  }

  console.log("Found Ahmed:", ahmed.email, ahmed.user_metadata.store_id);

  // Generate new store ID
  const newStoreId = crypto.randomUUID();
  console.log("New Store ID for Ahmed:", newStoreId);

  // Insert new store
  const { error: storeError } = await supabaseAdmin.from('stores').insert({
    id: newStoreId,
    name: ahmed.user_metadata.store_name_ar || ahmed.user_metadata.full_name || 'متجر أحمد'
  });

  if (storeError) {
    console.error("Error creating store:", storeError);
    return;
  }

  // Update user metadata
  const updatedMetadata = {
    ...ahmed.user_metadata,
    store_id: newStoreId
  };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(ahmed.id, {
    user_metadata: updatedMetadata
  });

  if (updateError) {
    console.error("Error updating user:", updateError);
  } else {
    console.log("Successfully fixed Ahmed's store ID!");
  }
}

run();
