const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

// Use service role key to access auth admin API
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_EMAIL = 'amr@tujaria.com'; // ← change if needed

async function diagnose() {
  console.log('🔍 Listing all auth users...\n');

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);
  users.forEach(u => {
    console.log(`  📧 ${u.email}`);
    console.log(`     ID:       ${u.id}`);
    console.log(`     Role:     ${u.user_metadata?.role || '(none)'}`);
    console.log(`     Confirmed: ${u.email_confirmed_at ? '✅' : '❌ NOT confirmed'}`);
    console.log('');
  });

  // Check if the target user exists
  const target = users.find(u => u.email === TARGET_EMAIL);
  if (!target) {
    console.log(`⚠️  User "${TARGET_EMAIL}" not found.`);
    console.log('\n📋 Available emails:', users.map(u => u.email).join(', '));
    return;
  }

  console.log(`\n✅ Found target user: ${target.email}`);
  console.log(`   Current role: ${target.user_metadata?.role || '(none — will be treated as CUSTOMER)'}`);

  if (target.user_metadata?.role !== 'ADMIN') {
    console.log('\n🔧 Fixing: setting role to ADMIN...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, {
      user_metadata: { ...target.user_metadata, role: 'ADMIN' }
    });

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Role updated to ADMIN successfully!');
    }
  } else {
    console.log('   Role is already ADMIN — login should work.');
  }

  // Check email confirmation
  if (!target.email_confirmed_at) {
    console.log('\n🔧 Email not confirmed. Confirming now...');
    const { error: confirmError } = await supabase.auth.admin.updateUserById(target.id, {
      email_confirm: true
    });
    if (confirmError) {
      console.error('❌ Confirm failed:', confirmError.message);
    } else {
      console.log('✅ Email confirmed!');
    }
  }
}

diagnose().catch(console.error);
