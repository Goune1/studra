import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, allow all requests through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl.startsWith('your_')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!user || !adminEmail || user.email !== adminEmail) {
      const url = request.nextUrl.clone()
      url.pathname = user ? '/' : '/login'
      return NextResponse.redirect(url)
    }
  }

  const isDashboardRoute = pathname.startsWith('/dashboard') ||
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
    pathname.startsWith('/billing')

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if ((pathname === '/login' || pathname === '/register') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
