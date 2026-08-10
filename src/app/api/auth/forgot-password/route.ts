import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/resend'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { resolveServerLocale } from '@/i18n/server-locale'
import { getLocalizedPathname, isAppLocale, type AppLocale } from '@/i18n/pathname'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'

// Réponse toujours identique : on n'expose jamais si l'email existe (énumération).
const GENERIC_OK = { ok: true } as const

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip, 'auth:forgot-password', 5, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(GENERIC_OK)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(GENERIC_OK)
  }

  const admin = getSupabaseAdmin()

  const { data: profile } = await admin
    .from('profiles')
    .select('preferred_locale')
    .eq('email', email)
    .maybeSingle()

  const profileLocale = (profile as { preferred_locale?: string | null } | null)?.preferred_locale
  const locale: AppLocale = isAppLocale(profileLocale)
    ? profileLocale
    : resolveServerLocale(request)

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  // Compte inexistant ou provider externe : on reste silencieux côté client.
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(GENERIC_OK)
  }

  const resetUrl = new URL(getLocalizedPathname('/reset-password', locale), APP_URL)
  resetUrl.searchParams.set('token_hash', data.properties.hashed_token)
  resetUrl.searchParams.set('type', 'recovery')

  await sendPasswordResetEmail(email, resetUrl.toString(), locale).catch(console.error)

  return NextResponse.json(GENERIC_OK)
}
