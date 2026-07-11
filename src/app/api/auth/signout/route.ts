import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  if (supabase) {
    // This signs out on the server side and properly clears the session cookies
    await supabase.auth.signOut()
  }

  // Get the locale from the request to redirect to the correct login page
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') || 'ar'

  // Redirect to login page - the session cookies are now cleared
  return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
}
