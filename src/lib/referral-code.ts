/**
 * Format et cookie du parrainage utilisateur (lien https://www.studra.fr/?ref=CODE).
 *
 * Module sans dépendance : partagé par le proxy, les routes serveur et
 * AffiliateTracker côté client. Aucune requête base de données ici ; la
 * résolution du code se fait à l'inscription (referral_attribute, migration 022).
 */

/** 8 caractères sans 0 O 1 I L, comme generate_referral_code (migration 020). */
export const REFERRAL_CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/

export const REFERRAL_COOKIE = 'studra_referral'

export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export function isReferralCode(value: string | null | undefined): value is string {
  return typeof value === 'string' && REFERRAL_CODE_PATTERN.test(value)
}

type ReferralRequest = {
  nextUrl: { searchParams: URLSearchParams }
  cookies: { get(name: string): { value: string } | undefined }
}

type ReferralResponse = {
  cookies: {
    set(name: string, value: string, options: {
      httpOnly: boolean
      sameSite: 'lax'
      secure: boolean
      path: string
      maxAge: number
    }): unknown
  }
}

/**
 * Pose le cookie de parrainage quand `?ref=` porte un code au bon format.
 * First-touch : un cookie valide déjà présent n'est jamais écrasé.
 */
export function setReferralCookie(request: ReferralRequest, response: ReferralResponse): void {
  const code = request.nextUrl.searchParams.get('ref')
  if (!isReferralCode(code)) return
  if (isReferralCode(request.cookies.get(REFERRAL_COOKIE)?.value)) return

  response.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  })
}
