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

  // Find Amr
  const amr = users.find(u => u.email === 'amr232948@gmail.com');
  if (!amr) {
    console.log("Amr not found!");
    return;
  }

  console.log("Found Amr:", amr.email);

  // Update Amr's metadata to remove store references and ensure he is purely ADMIN
  const updatedMetadata = { ...amr.user_metadata };
  delete updatedMetadata.store_id;
  delete updatedMetadata.store_name_ar;
  delete updatedMetadata.store_name_en;
  delete updatedMetadata.commission_rate;
  updatedMetadata.role = 'ADMIN';

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(amr.id, {
    user_metadata: updatedMetadata
  });

  if (updateError) {
    console.error("Error updating Amr:", updateError);
  } else {
    console.log("Successfully cleaned up Amr's metadata. He is now purely an ADMIN with no store.");
  }
}

run();
