const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

async function inspect() {
  const res = await fetch(url + '/rest/v1/', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  const data = await res.json();
  
  console.log('--- TABLES IN POSTGREST SCHEMA ---');
  const paths = Object.keys(data.paths);
  console.log(paths);

  console.log('\n--- DEFINITIONS ---');
  console.log(Object.keys(data.definitions));

  // Let's print the fields of profiles and stores if defined
  if (data.definitions.profiles) {
    console.log('\n--- PROFILES PROPERTIES ---');
    console.log(data.definitions.profiles.properties);
  }
  if (data.definitions.stores) {
    console.log('\n--- STORES PROPERTIES ---');
    console.log(data.definitions.stores.properties);
  }
  if (data.definitions.products) {
    console.log('\n--- PRODUCTS PROPERTIES ---');
    console.log(data.definitions.products.properties);
  }
}

inspect();
