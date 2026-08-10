import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getAffiliateByCode, attributeReferral } from '@/lib/affiliate'
import { cookies } from 'next/headers'
import { resolveServerLocale } from '@/i18n/server-locale'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_ERROR = 'Inscription impossible. Vérifiez vos informations ou réessayez plus tard.'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip, 'auth:register', 5, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  let body: { email?: unknown; password?: unknown; fullName?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir entre 8 et 72 caractères.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error || !data.user) {
    // Message générique : on n'expose pas si l'email existe déjà (énumération).
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const locale = resolveServerLocale(request)
  await supabase
    .from('profiles')
    .update({preferred_locale: locale})
    .eq('id', data.user.id)
  await sendWelcomeEmail(email, locale).catch(console.error)

  // Attribution d'affiliation si un cookie de parrainage est présent
  const cookieStore = await cookies()
  const refCode = cookieStore.get('studra_ref')?.value
  if (refCode && data.user) {
    const affiliate = await getAffiliateByCode(refCode).catch(() => null)
    if (affiliate) {
      await attributeReferral(affiliate.id, data.user.id).catch(console.error)
    }
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } })
}
