import { createClient } from '@/lib/supabase/server'
import { PLAN_SELECT, resolvePlan } from '@/lib/plan'
import { referralLink } from '@/lib/referral-code'
import { summarizeReferrals, type ReferralRow, type RewardRow } from '@/lib/referral-summary'
import { ParrainageView } from './parrainage-view'

export default async function ParrainagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, referralsRes, rewardsRes] = await Promise.all([
    supabase.from('profiles').select(`referral_code, ${PLAN_SELECT}`).eq('id', user!.id).single(),
    supabase
      .from('referrals')
      .select('id, status, created_at, qualified_at, consumed_at, reward_id')
      .eq('referrer_id', user!.id),
    supabase.from('referral_rewards').select('id, sequence').eq('referrer_id', user!.id),
  ])

  const profile = profileRes.data
  const { offeredProUntil } = resolvePlan(profile)

  return (
    <ParrainageView
      link={profile?.referral_code ? referralLink(profile.referral_code) : null}
      summary={summarizeReferrals((referralsRes.data ?? []) as ReferralRow[], (rewardsRes.data ?? []) as RewardRow[])}
      offeredProUntil={offeredProUntil}
    />
  )
}
