import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/src/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase credentials missing. App will run in demo mode.');
    }
    return null as any;
  }

  return createBrowserClient<Database>(url, key);
}
