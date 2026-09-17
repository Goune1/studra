import {NextResponse, type NextRequest} from 'next/server'
import {setReferralCookie} from '@/lib/referral-code'
import {stripLegacyLocalePrefix} from '@/lib/route-access'
import {updateSession} from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const frenchPathname = stripLegacyLocalePrefix(request.nextUrl.pathname)
  if (frenchPathname) {
    const url = request.nextUrl.clone()
    url.pathname = frenchPathname
    const response = NextResponse.redirect(url, 308)
    setReferralCookie(request, response)
    return response
  }

  const {response} = await updateSession(request)
  setReferralCookie(request, response)
  return response
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
