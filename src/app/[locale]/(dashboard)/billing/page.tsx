import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {getTranslations} from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '@/components/checkout-button'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'
import { Eyebrow } from '@/components/ui/Eyebrow'

const COLOR = '#1F4D3F'

export default async function BillingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('dashboard.billing')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
        <h1 className="section-h">{t('title')}</h1>
      </div>

      <div
        className="rounded-2xl p-8 mb-6 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '40ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>{t('currentPlan')}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-500)' }}>{t('description')}</p>
          </div>
          <span
            className="mono px-3 py-1.5 rounded-full text-xs font-semibold"
            style={isPro
              ? { background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}30` }
              : { background: 'var(--surface-2)', color: 'var(--ink-500)', border: '1px solid var(--border)' }
            }
          >
            {isPro ? t('pro') : t('free')}
          </span>
        </div>

        {!isPro && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{ background: 'var(--accent-soft)', border: `1px solid ${COLOR}25` }}
          >
            <p className="text-sm" style={{ color: COLOR }}>
              {generationsLeft === 0
                ? t('allGenerationsUsed')
                : t('generationsRemaining', {count: generationsLeft!})}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {[
            { label: t('flashcards'), included: isPro },
            { label: t('notes'), included: isPro },
            { label: t('generations'), value: isPro ? t('unlimited') : '5' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--ink-700)' }}>{item.label}</span>
              {item.value ? (
                <span className="mono text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.value}</span>
              ) : (
                <span style={{ color: item.included ? COLOR : 'var(--ink-400)' }}>
                  {item.included ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>

        {!isPro ? <CheckoutButton /> : <ManageSubscriptionButton />}
      </div>
    </div>
  )
}
