import { cookies } from 'next/headers'
import { after } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { PLAN_SELECT, resolvePlan } from '@/lib/plan'
import { captureServerEvent } from '@/lib/posthog-server'
import { sendReferralQualifiedEmail, sendReferralRewardEmail } from '@/lib/resend'
import { isReferralCode, REFERRAL_COOKIE } from '@/lib/referral-code'
import { summarizeReferrals, type ReferralRow, type RewardRow } from '@/lib/referral-summary'

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

/** email, google, ... : fournisseur utilisé pour l'inscription. */
export type SignupMethod = string

/**
 * Attribue un utilisateur qui vient de s'inscrire (email ou OAuth) au parrain
 * du cookie posé par le proxy, puis supprime le cookie.
 *
 * Les règles (nouvel utilisateur, auto-parrainage, unicité, parrain actif)
 * vivent dans la RPC referral_attribute (migration 022). Ne lève jamais : un
 * parrainage ne doit pas pouvoir faire échouer une inscription. Si la RPC
 * échoue, le cookie est conservé pour qu'un prochain passage réessaie.
 */
export async function attributeReferralFromCookie(
  referredUserId: string,
  method: SignupMethod,
): Promise<ReferralAttribution | null> {
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
    if (!row?.referral_id || !row.referrer_id) return null

    const attribution = { referralId: row.referral_id, referrerId: row.referrer_id }
    after(() => trackReferralSignup(attribution, referredUserId, method))
    return attribution
  } catch (error) {
    console.error('[referral] attribution failed:', error)
    return null
  }
}

async function trackReferralSignup(attribution: ReferralAttribution, referredUserId: string, method: SignupMethod) {
  try {
    // Lecture seule : l'attribution affiliée de la même inscription a lieu juste avant dans la route.
    const { data, error } = await getSupabaseAdmin()
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .maybeSingle()
    if (error) throw new Error(error.message)

    await captureServerEvent(referredUserId, 'referral_signup', {
      referral_id: attribution.referralId,
      referrer_id: attribution.referrerId,
      method,
      had_affiliate_attribution: data !== null,
    })
  } catch (error) {
    console.error('[referral] referral_signup tracking failed:', error)
  }
}

/**
 * Point unique de qualification, appelé via after() par les 9 routes qui
 * consomment un crédit, une fois la génération réussie et sauvegardée.
 *
 * Idempotent : sans filleul pending pour cet utilisateur, la RPC
 * referral_qualify (migration 023) ne fait rien. La qualification et l'octroi
 * éventuel du mois de Pro se font dans une seule transaction verrouillée.
 * Les notifications ne partent que lors d'une transition réelle.
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

    const qualification: ReferralQualification = {
      referralId: row.referral_id,
      referrerId: row.referrer_id,
      qualifiedCount: row.qualified_count ?? 0,
      reward: row.reward_id && row.reward_sequence && row.pro_until
        ? { rewardId: row.reward_id, sequence: row.reward_sequence, proUntil: row.pro_until }
        : null,
    }
    await notifyReferralQualification(qualification, userId)
    return qualification
  } catch (error) {
    console.error('[referral] qualification failed:', error)
    return null
  }
}

// Les comptes anonymisés par deleteAccount portent une adresse @studra.invalid.
function deliverableEmail(email: string | null | undefined): string | null {
  return email && !email.endsWith('@studra.invalid') ? email : null
}

async function notifyReferralQualification(qualification: ReferralQualification, referredUserId: string) {
  try {
    const admin = getSupabaseAdmin()
    const [profileRes, referralsRes, rewardsRes] = await Promise.all([
      admin.from('profiles').select(`email, ${PLAN_SELECT}`).eq('id', qualification.referrerId).maybeSingle(),
      admin
        .from('referrals')
        .select('id, status, created_at, qualified_at, consumed_at, reward_id')
        .eq('referrer_id', qualification.referrerId),
      admin.from('referral_rewards').select('id, sequence').eq('referrer_id', qualification.referrerId),
    ])
    if (profileRes.error) throw new Error(profileRes.error.message)
    if (referralsRes.error) throw new Error(referralsRes.error.message)
    if (rewardsRes.error) throw new Error(rewardsRes.error.message)

    const summary = summarizeReferrals((referralsRes.data ?? []) as ReferralRow[], (rewardsRes.data ?? []) as RewardRow[])
    const { hasStripeSubscription } = resolvePlan(profileRes.data)
    const email = deliverableEmail(profileRes.data?.email)
    const { reward } = qualification

    const tasks: Promise<unknown>[] = [
      captureServerEvent(qualification.referrerId, 'referral_qualified', {
        referral_id: qualification.referralId,
        referred_user_id: referredUserId,
        qualified_count: qualification.qualifiedCount,
        progress: summary.progress,
        triggered_reward: reward !== null,
      }),
    ]

    if (reward) {
      tasks.push(captureServerEvent(qualification.referrerId, 'referral_reward_granted', {
        reward_id: reward.rewardId,
        reward_sequence: reward.sequence,
        months: 1,
        pro_until: reward.proUntil,
        cap_reached: summary.capReached,
        has_stripe_subscription: hasStripeSubscription,
      }))
      // L'email de récompense couvre aussi la qualification qui l'a déclenchée.
      if (email) tasks.push(sendReferralRewardEmail(email, { sequence: reward.sequence, proUntil: reward.proUntil, hasStripeSubscription }).then(throwOnResendError))
    } else if (email) {
      tasks.push(sendReferralQualifiedEmail(email, { progress: summary.progress }).then(throwOnResendError))
    }

    for (const result of await Promise.allSettled(tasks)) {
      if (result.status === 'rejected') console.error('[referral] notification failed:', result.reason)
    }
  } catch (error) {
    console.error('[referral] notification failed:', error)
  }
}

function throwOnResendError(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(`resend: ${result.error.message}`)
}
