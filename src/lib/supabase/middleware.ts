import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'
import {
  getLocalizedPathname,
  isAppLocale,
  resolveLocalePreference,
  type AppLocale,
} from '@/i18n/pathname'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type SessionOptions = {
  pathnameLocale?: AppLocale | null
  pathname?: string
}

type SessionResult = {
  response: NextResponse
  locale: AppLocale
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie)
  }

  return target
}

function persistLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: AppLocale,
) {
  request.cookies.set(LOCALE_COOKIE, locale)
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
}

export async function updateSession(
  request: NextRequest,
  {
    pathnameLocale = null,
    pathname = request.nextUrl.pathname,
  }: SessionOptions = {},
): Promise<SessionResult> {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  const acceptLanguage = request.headers.get('accept-language')
  const automaticLocale = resolveLocalePreference({
    pathnameLocale,
    cookieLocale,
    acceptLanguage,
  })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.startsWith('your_')) {
    const response = NextResponse.next({request})
    persistLocaleCookie(request, response, automaticLocale)
    return {response, locale: automaticLocale}
  }

  let supabaseResponse = NextResponse.next({request})

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({request})
        cookiesToSet.forEach(({name, value, options}) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: {user},
  } = await supabase.auth.getUser()

  let profileLocale: AppLocale | null = null
  if (user) {
    const {data: profile} = await supabase
      .from('profiles')
      .select('preferred_locale')
      .eq('id', user.id)
      .maybeSingle()

    profileLocale = isAppLocale(profile?.preferred_locale)
      ? profile.preferred_locale
      : null
  }

  // Locale used to render THIS request: an explicit prefix in the URL wins, so
  // a shared /en/... link renders in English whatever the visitor's preference.
  const locale = resolveLocalePreference({
    pathnameLocale,
    profileLocale,
    cookieLocale,
    acceptLanguage,
  })

  // Stored preference: deliberately ignores the URL prefix. Browsing to an
  // /en/... URL (back button, shared link, stale tab) must not silently
  // rewrite a preference the user set in the settings, otherwise the old
  // locale keeps resurrecting after they switched back.
  const preferredLocale = resolveLocalePreference({
    profileLocale,
    cookieLocale,
    acceptLanguage,
  })

  if (user && !profileLocale) {
    await supabase
      .from('profiles')
      .update({preferred_locale: preferredLocale})
      .eq('id', user.id)
  }

  persistLocaleCookie(request, supabaseResponse, preferredLocale)

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = getLocalizedPathname(path, locale)
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url))
  }

  if (pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!user || !adminEmail || user.email !== adminEmail) {
      return {response: redirect(user ? '/' : '/login'), locale}
    }
  }

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/flashcards') ||
    pathname.startsWith('/fiches') ||
    pathname.startsWith('/schemas') ||
    pathname.startsWith('/timelines') ||
    pathname.startsWith('/exams') ||
    pathname.startsWith('/lacunes') ||
    pathname.startsWith('/socrate') ||
    pathname.startsWith('/recall') ||
    pathname.startsWith('/annales') ||
    pathname.startsWith('/planning') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/affiliate')

  if (isDashboardRoute && !user) {
    return {response: redirect('/login'), locale}
  }

  if ((pathname === '/login' || pathname === '/register') && user) {
    return {response: redirect('/dashboard'), locale}
  }

  return {response: supabaseResponse, locale}
}

export function mergeSessionCookies(
  sessionResponse: NextResponse,
  response: NextResponse,
) {
  return copyResponseCookies(sessionResponse, response)
}
