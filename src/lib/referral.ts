import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isReferralCode, REFERRAL_COOKIE } from '@/lib/referral-code'

export interface ReferralAttribution {
  referralId: string
  referrerId: string
}

/**
 * Attribue un utilisateur qui vient de s'inscrire (email ou OAuth) au parrain
 * du cookie posé par le proxy, puis supprime le cookie.
 *
 * Les règles (nouvel utilisateur, auto-parrainage, unicité, parrain actif)
 * vivent dans la RPC referral_attribute (migration 022). Ne lève jamais : un
 * parrainage ne doit pas pouvoir faire échouer une inscription. Si la RPC
 * échoue, le cookie est conservé pour qu'un prochain passage réessaie.
 */
export async function attributeReferralFromCookie(referredUserId: string): Promise<ReferralAttribution | null> {
  const cookieStore = await cookies()
  const code = cookieStore.get(REFERRAL_COOKIE)?.value
  if (code === undefined) return null
  if (!isReferralCode(code)) {
    cookieStore.delete(REFERRAL_COOKIE)
    return null
  }

  try {
    const { data, error } = await getSupabaseAdmin().rpc('referral_attribute', {
      p_referral_code: code,
      p_referred_id: referredUserId,
    })
    if (error) {
      console.error('[referral] attribution failed:', error.message)
      return null
    }

    cookieStore.delete(REFERRAL_COOKIE)
    const row = (Array.isArray(data) ? data[0] : data) as { referral_id?: string; referrer_id?: string } | null
    return row?.referral_id && row.referrer_id ? { referralId: row.referral_id, referrerId: row.referrer_id } : null
  } catch (error) {
    console.error('[referral] attribution failed:', error)
    return null
  }
}
