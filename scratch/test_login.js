const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, anonKey);

async function testLogin() {
  const EMAIL = 'amr232948@gmail.com';
  const PASSWORD = 'Amr$1492000';

  console.log(`🔐 Testing login for: ${EMAIL}`);
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });

  if (error) {
    console.error('❌ Login failed:', error.message);

    // If wrong password, reset it using service role
    console.log('\n🔧 Resetting password via service role...');
    const serviceKey = fs.readFileSync('.env.local', 'utf8').match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
    const adminSupabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const userId = '533d09f9-8d1f-4772-abb7-88901aeb8920';
    const { error: resetError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: PASSWORD
    });

    if (resetError) {
      console.error('❌ Password reset failed:', resetError.message);
    } else {
      console.log(`✅ Password reset to "${PASSWORD}"`);
      console.log('\n🔁 Re-testing login...');
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
      if (error2) {
        console.error('❌ Still failing:', error2.message);
      } else {
        console.log('✅ Login SUCCESS!');
        console.log(`   Role: ${data2.user?.user_metadata?.role}`);
      }
    }
  } else {
    console.log('✅ Login SUCCESS!');
    console.log(`   Role: ${data?.user?.user_metadata?.role}`);
  }
}

testLogin().catch(console.error);
