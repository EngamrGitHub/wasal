const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('🔍 Checking stores table...\n');

  const { data: stores, error: storeErr } = await supabase.from('stores').select('*');
  if (storeErr) {
    console.error('❌ Error fetching stores:', storeErr.message);
    return;
  }

  if (!stores || stores.length === 0) {
    console.log('⚠️  No stores found! This is the problem — products reference a store_id that doesn\'t exist.\n');
    console.log('🔧 Creating a default store for the admin user...');

    // Get admin user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.user_metadata?.role === 'ADMIN');

    if (!adminUser) {
      console.error('❌ No ADMIN user found');
      return;
    }

    console.log(`   Admin user: ${adminUser.email} (${adminUser.id})`);

    const { data: newStore, error: createErr } = await supabase
      .from('stores')
      .insert({
        owner_id: adminUser.id,
        name: 'Tujaria Store',
        slug: 'tujaria-store',
        description: 'المتجر الرئيسي',
        is_active: true,
      })
      .select()
      .single();

    if (createErr) {
      console.error('❌ Failed to create store:', createErr.message);
      console.log('\n📋 Store table columns might differ. Trying minimal insert...');

      const { data: minimal, error: minErr } = await supabase
        .from('stores')
        .insert({ owner_id: adminUser.id, name: 'Tujaria Store' })
        .select()
        .single();

      if (minErr) {
        console.error('❌ Minimal insert also failed:', minErr.message);
        // List columns
        const { data: sample } = await supabase.from('stores').select('*').limit(0);
        console.log('Sample (columns check):', sample);
      } else {
        console.log('✅ Store created:', minimal);
      }
    } else {
      console.log('✅ Store created successfully!');
      console.log(`   Store ID: ${newStore.id}`);
      console.log(`   Store Name: ${newStore.name}`);
    }
  } else {
    console.log(`✅ Found ${stores.length} store(s):\n`);
    stores.forEach(s => {
      console.log(`   🏪 ${s.name || s.store_name || '(unnamed)'}`);
      console.log(`      ID:       ${s.id}`);
      console.log(`      Owner:    ${s.owner_id}`);
      console.log(`      Active:   ${s.is_active}`);
      console.log('');
    });

    console.log('\n🔍 Checking products with invalid store_id...');
    const validIds = stores.map(s => s.id);
    const { data: products } = await supabase.from('products').select('id, name, store_id');
    const orphaned = (products || []).filter(p => !validIds.includes(p.store_id));

    if (orphaned.length > 0) {
      console.log(`⚠️  ${orphaned.length} product(s) with invalid store_id:`);
      orphaned.forEach(p => console.log(`   - ${p.name} → store_id: ${p.store_id}`));
    } else {
      console.log('✅ All products have valid store_ids.');
      console.log('\n💡 The error likely happens when ADDING a new product with a hardcoded/wrong store_id in your code.');
    }
  }
}

diagnose().catch(console.error);
