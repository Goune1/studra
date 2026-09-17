/**
 * Résumé du parrainage d'un utilisateur pour la page /settings/parrainage.
 *
 * Module pur (aucun import) : il met en forme les lignes referrals et
 * referral_rewards que la RLS laisse lire au parrain. Les règles d'octroi
 * restent en SQL (migration 023) ; les constantes ne servent qu'à l'affichage.
 */

export const REFERRALS_PER_MONTH = 2
export const MAX_REWARDED_MONTHS = 3

export interface ReferralRow {
  id: string
  status: 'pending' | 'qualified'
  created_at: string
  qualified_at: string | null
  consumed_at: string | null
  reward_id: string | null
}

export interface RewardRow {
  id: string
  sequence: number
}

export type ReferralHistoryStatus = 'pending' | 'qualified' | 'rewarded' | 'over_cap'

export interface ReferralHistoryItem {
  id: string
  /** Rang d'inscription (1 = premier filleul), jamais d'information personnelle. */
  position: number
  signedUpAt: string
  qualifiedAt: string | null
  status: ReferralHistoryStatus
  rewardSequence: number | null
}

export interface ReferralSummary {
  qualifiedCount: number
  monthsGranted: number
  capReached: boolean
  /** Filleuls qualifiés comptant pour le prochain mois (0 ou 1 sur 2), null au plafond. */
  progress: number | null
  history: ReferralHistoryItem[]
}

export function summarizeReferrals(referrals: ReferralRow[], rewards: RewardRow[]): ReferralSummary {
  const monthsGranted = rewards.length
  const capReached = monthsGranted >= MAX_REWARDED_MONTHS
  const sequenceByReward = new Map(rewards.map((reward) => [reward.id, reward.sequence]))
  const qualified = referrals.filter((referral) => referral.status === 'qualified')
  const unconsumed = qualified.filter((referral) => referral.consumed_at === null).length

  const chronological = [...referrals].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
  const history = chronological
    .map((referral, index): ReferralHistoryItem => {
      const rewardSequence = referral.reward_id ? sequenceByReward.get(referral.reward_id) ?? null : null
      let status: ReferralHistoryStatus = 'pending'
      if (referral.status === 'qualified') {
        if (referral.consumed_at !== null) status = 'rewarded'
        else status = capReached ? 'over_cap' : 'qualified'
      }
      return {
        id: referral.id,
        position: index + 1,
        signedUpAt: referral.created_at,
        qualifiedAt: referral.qualified_at,
        status,
        rewardSequence,
      }
    })
    .reverse()

  return {
    qualifiedCount: qualified.length,
    monthsGranted,
    capReached,
    progress: capReached ? null : unconsumed % REFERRALS_PER_MONTH,
    history,
  }
}

/**
 * Le bandeau de promotion du dashboard ne s'adresse qu'aux utilisateurs pour
 * qui un mois offert a de la valeur : pas aux abonnés Stripe (le mois court en
 * parallèle de l'abonnement), ni à ceux qui ont déjà atteint le plafond.
 */
export function shouldPromoteReferral({
  referralCode,
  hasStripeSubscription,
  monthsGranted,
}: {
  referralCode: string | null | undefined
  hasStripeSubscription: boolean
  monthsGranted: number
}): boolean {
  return Boolean(referralCode) && !hasStripeSubscription && monthsGranted < MAX_REWARDED_MONTHS
}
