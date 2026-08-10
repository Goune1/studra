import createMiddleware from 'next-intl/middleware'
import type {NextRequest} from 'next/server'
import {
  getPathnameLocale,
  getPathnameWithoutLocale,
  shouldHandleI18n,
} from '@/i18n/pathname'
import {routing} from '@/i18n/routing'
import {
  mergeSessionCookies,
  updateSession,
} from '@/lib/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const pathnameLocale = getPathnameLocale(request.nextUrl.pathname)
  const {pathname} = getPathnameWithoutLocale(request.nextUrl.pathname)
  const {response: sessionResponse} = await updateSession(request, {
    pathnameLocale,
    pathname,
  })

  if (sessionResponse.headers.has('location')) {
    return sessionResponse
  }

  if (!shouldHandleI18n(request.nextUrl.pathname)) {
    return sessionResponse
  }

  const i18nResponse = handleI18nRouting(request)
  return mergeSessionCookies(sessionResponse, i18nResponse)
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
