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
  
  console.log('--- RPC FUNCTIONS ---');
  const rpcPaths = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
  console.log(rpcPaths);
}

inspect();
