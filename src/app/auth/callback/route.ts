import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { attributeReferral, qualifyReferral } from '@/lib/affiliate'
import { verifyAffiliateCookie } from '@/lib/affiliate-cookie'
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
      let isNewUser = false
      if (user?.email) {
        // Retry attribution on every successful callback. This covers an email
        // signup where the initial server-side attribution temporarily failed.
        const cookieStore = await cookies()
        const refCode = verifyAffiliateCookie(cookieStore.get('studra_ref')?.value)
        if (refCode) {
          await attributeReferral(refCode, user.id, Boolean(user.email_confirmed_at)).catch(console.error)
        }
        if (user.email_confirmed_at) {
          await qualifyReferral(user.id).catch(console.error)
        }
        const createdAt = new Date(user.created_at).getTime()
        const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime()
        isNewUser = Math.abs(lastSignIn - createdAt) < 60_000
        if (isNewUser) {
          sendWelcomeEmail(user.email).catch(console.error)

        }
      }
      // Cette route serveur n'a pas accès à posthog-js. On signale au client, via un
      // simple param de redirection, qu'il s'agit d'un nouvel inscrit OAuth, pour que
      // le client déclenche signup_completed + identify() exactement une fois
      // (cf. OAuthSignupTracker dans providers.tsx). Aucune route/endpoint créé.
      const redirectUrl = new URL(`${origin}${safePath}`)
      if (isNewUser) {
        redirectUrl.searchParams.set('signup', 'oauth')
      }
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
