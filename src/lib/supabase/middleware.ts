import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'
import {isDashboardRoute} from '@/lib/route-access'

type SessionResult = {response: NextResponse}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie)
  return target
}

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl.startsWith('your_')) {
    return {response: NextResponse.next({request})}
  }

  let response = NextResponse.next({request})
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
        response = NextResponse.next({request})
        cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options))
      },
    },
  })
  const {data: {user}} = await supabase.auth.getUser()
  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return copyResponseCookies(response, NextResponse.redirect(url))
  }
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!user || !adminEmail || user.email !== adminEmail) return {response: redirect(user ? '/' : '/login')}
  }
  if (isDashboardRoute(pathname) && !user) return {response: redirect('/login')}
  if ((pathname === '/login' || pathname === '/register') && user) return {response: redirect('/dashboard')}
  return {response}
}
