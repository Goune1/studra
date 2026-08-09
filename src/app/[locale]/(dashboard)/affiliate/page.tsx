import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {getTranslations} from 'next-intl/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAffiliateStats } from '@/lib/affiliate'
import { AffiliateRegistrationForm } from '@/components/affiliate/AffiliateRegistrationForm'
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard'
import { AffiliateGate } from './affiliate-gate'
import type { Affiliate, AffiliateCommission, AffiliatePayout } from '@/types'

export default async function AffiliatePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('dashboard.affiliate')
  const cookieStore = await cookies()
  const access = cookieStore.get('affiliate_beta_access')
  const expected = process.env.BAC_BETA_PASSWORD
  const expectedHash = expected ? createHash('sha256').update(expected).digest('hex') : null

  if (!expectedHash || access?.value !== expectedHash) {
    return <AffiliateGate />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-4)' }}>
          {t('description')}
        </p>
        <AffiliateRegistrationForm userEmail={user!.email ?? ''} />
      </div>
    )
  }

  const [stats, commissionsRes, payoutsRes, settingsRes] = await Promise.all([
    getAffiliateStats(affiliate.id),
    supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false }),
    supabase.from('affiliate_settings').select('minimum_payout_threshold').eq('id', 1).single(),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'
  const threshold = settingsRes.data?.minimum_payout_threshold ?? 10

  return (
    <AffiliateDashboard
      affiliate={affiliate as Affiliate}
      stats={stats}
      commissions={(commissionsRes.data ?? []) as AffiliateCommission[]}
      payouts={(payoutsRes.data ?? []) as AffiliatePayout[]}
      appUrl={appUrl}
      minimumPayoutThreshold={Number(threshold)}
    />
  )
}
