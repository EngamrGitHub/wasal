const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  const email = 'amr232948@gmail.com';
  const password = 'Amr$1492000';
  
  console.log(`Checking if user ${email} already exists in auth...`);

  // 1. List users to see if they exist
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);

  let userId;

  if (existingUser) {
    console.log(`User exists with ID: ${existingUser.id}. Updating metadata to role=ADMIN...`);
    
    // Update existing user to have ADMIN role in metadata
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: {
          role: 'ADMIN',
          full_name: 'عمرو الأدمن'
        }
      }
    );

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return;
    }

    userId = existingUser.id;
    console.log('✅ User metadata successfully updated to ADMIN!');
  } else {
    console.log(`User does not exist. Creating new user with role=ADMIN...`);
    
    // Create new admin user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        full_name: 'عمرو الأدمن'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    userId = user.id;
    console.log(`✅ Admin user successfully created with ID: ${userId}!`);
  }

  // 2. Ensure profile row exists in profiles table
  console.log('Upserting profile row into profiles table...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'عمرو الأدمن',
      phone: '01000000000'
    });

  if (profileError) {
    console.error('Error upserting profile:', profileError);
  } else {
    console.log('✅ Profile row successfully created/updated in database!');
  }
}

run();
