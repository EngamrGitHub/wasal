import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  if (supabase) {
    await supabase.auth.signOut()
  }

  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') || 'ar'

  const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  
  // Manually clear all Supabase auth cookies to ensure session is fully gone
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token', 
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
  ]
  cookieNames.forEach(name => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
  })

  return response
}

export async function POST(request: NextRequest) {
  return GET(request)
}
