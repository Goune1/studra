import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { getAffiliateByCode, attributeReferral } from '@/lib/affiliate'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const user = data.session?.user ?? data.user
      if (user?.email) {
        const createdAt = new Date(user.created_at).getTime()
        const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime()
        const isNewUser = Math.abs(lastSignIn - createdAt) < 60_000
        if (isNewUser) {
          sendWelcomeEmail(user.email).catch(console.error)

          // Attribution d'affiliation pour les nouveaux inscrits via OAuth
          const cookieStore = await cookies()
          const refCode = cookieStore.get('studra_ref')?.value
          if (refCode && user.id) {
            const affiliate = await getAffiliateByCode(refCode).catch(() => null)
            if (affiliate) {
              await attributeReferral(affiliate.id, user.id).catch(console.error)
            }
          }
        }
      }
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
