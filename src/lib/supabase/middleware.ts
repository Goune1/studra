import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'
import {
  getLocalizedPathname,
  type AppLocale,
} from '@/i18n/pathname'

type SessionOptions = {
  locale?: AppLocale
  pathname?: string
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie)
  }

  return target
}

export async function updateSession(
  request: NextRequest,
  {locale = 'fr', pathname = request.nextUrl.pathname}: SessionOptions = {}
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.startsWith('your_')) {
    return NextResponse.next({request})
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

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = getLocalizedPathname(path, locale)
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url))
  }

  if (pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!user || !adminEmail || user.email !== adminEmail) {
      return redirect(user ? '/' : '/login')
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
    return redirect('/login')
  }

  if ((pathname === '/login' || pathname === '/register') && user) {
    return redirect('/dashboard')
  }

  return supabaseResponse
}

export function mergeSessionCookies(
  sessionResponse: NextResponse,
  response: NextResponse
) {
  return copyResponseCookies(sessionResponse, response)
}
