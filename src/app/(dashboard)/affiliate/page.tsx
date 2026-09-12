import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAffiliateStats } from '@/lib/affiliate'
import { AffiliateRegistrationForm } from '@/components/affiliate/AffiliateRegistrationForm'
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard'
import { AffiliateGate } from './affiliate-gate'
import styles from './affiliate.module.css'
import type { Affiliate, AffiliateCommission, AffiliatePayout } from '@/types'

export default async function AffiliatePage() {
  const cookieStore = await cookies()
  const access = cookieStore.get('affiliate_beta_access')
  const expected = process.env.BAC_BETA_PASSWORD
  const expectedHash = expected ? createHash('sha256').update(expected).digest('hex') : null

  if (!expectedHash || access?.value !== expectedHash) return <AffiliateGate />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: settings, error: settingsError } = await supabase
    .from('affiliate_settings')
    .select('minimum_payout_threshold, affiliate_terms_version')
    .eq('id', 1)
    .single()
  if (settingsError || !settings) throw new Error('Configuration affiliation indisponible')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!affiliate) {
    return (
      <main className={styles.affiliatePage}>
        <header>
          <p className={styles.context}>Affiliation</p>
          <h1>Programme d’affiliation</h1>
          <p className={styles.summary}>Parraine de nouveaux utilisateurs et reçois une commission sur leurs paiements éligibles.</p>
        </header>
        <div className={styles.registration}><AffiliateRegistrationForm userEmail={user.email ?? ''} termsVersion={settings.affiliate_terms_version} /></div>
      </main>
    )
  }

  const [stats, commissionsRes, payoutsRes] = await Promise.all([
    getAffiliateStats(affiliate.id),
    supabase.from('affiliate_commissions').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('affiliate_payouts').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'
  return (
    <main className={styles.affiliatePage}>
      <AffiliateDashboard
        affiliate={affiliate as Affiliate}
        stats={stats}
        commissions={(commissionsRes.data ?? []) as AffiliateCommission[]}
        payouts={(payoutsRes.data ?? []) as AffiliatePayout[]}
        appUrl={appUrl}
        minimumPayoutThreshold={Number(settings.minimum_payout_threshold)}
      />
    </main>
  )
}
