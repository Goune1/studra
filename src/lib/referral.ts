import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isReferralCode, REFERRAL_COOKIE } from '@/lib/referral-code'

export interface ReferralQualification {
  referralId: string
  referrerId: string
  /** Filleuls qualifiés du parrain, celui-ci compris. */
  qualifiedCount: number
  /** Mois offert déclenché par cette qualification, s'il y en a un. */
  reward: { rewardId: string; sequence: number; proUntil: string } | null
}

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

/**
 * Point unique de qualification, appelé via after() par les 9 routes qui
 * consomment un crédit, une fois la génération réussie et sauvegardée.
 *
 * Idempotent : sans filleul pending pour cet utilisateur, la RPC
 * referral_qualify (migration 023) ne fait rien. La qualification et l'octroi
 * éventuel du mois de Pro se font dans une seule transaction verrouillée.
 * Ne lève jamais : exécutée après l'envoi de la réponse, une erreur est
 * seulement journalisée.
 */
export async function processReferralQualification(userId: string): Promise<ReferralQualification | null> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc('referral_qualify', { p_referred_id: userId })
    if (error) {
      console.error('[referral] qualification failed:', error.message)
      return null
    }

    const row = (Array.isArray(data) ? data[0] : data) as {
      referral_id?: string
      referrer_id?: string
      qualified_count?: number
      reward_id?: string | null
      reward_sequence?: number | null
      pro_until?: string | null
    } | null
    if (!row?.referral_id || !row.referrer_id) return null

    return {
      referralId: row.referral_id,
      referrerId: row.referrer_id,
      qualifiedCount: row.qualified_count ?? 0,
      reward: row.reward_id && row.reward_sequence && row.pro_until
        ? { rewardId: row.reward_id, sequence: row.reward_sequence, proUntil: row.pro_until }
        : null,
    }
  } catch (error) {
    console.error('[referral] qualification failed:', error)
    return null
  }
}
