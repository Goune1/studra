import {NextResponse, type NextRequest} from 'next/server'
import {stripLegacyLocalePrefix} from '@/lib/route-access'
import {updateSession} from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const frenchPathname = stripLegacyLocalePrefix(request.nextUrl.pathname)
  if (frenchPathname) {
    const url = request.nextUrl.clone()
    url.pathname = frenchPathname
    return NextResponse.redirect(url, 308)
  }

  return (await updateSession(request)).response
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
