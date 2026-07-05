const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  const { data: stores } = await supabase.from('stores').select('id, name, owner_id');
  console.log('Stores:', stores);

  for (const user of users) {
    console.log(`User: ${user.email}`);
    console.log(`  Metadata:`, user.user_metadata);

    // If the user doesn't have a valid store_id, let's assign one if they are ADMIN or if we can find their store
    const userStore = stores.find(s => s.owner_id === user.id) || stores[0];
    
    if (userStore && user.user_metadata?.store_id !== userStore.id) {
      console.log(`  Fixing store_id for ${user.email} -> ${userStore.id}`);
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          store_id: userStore.id
        }
      });
    }
  }
  
  console.log('Done checking and fixing user metadata.');
}

run().catch(console.error);
