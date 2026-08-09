import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {getTranslations} from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutButton } from '@/components/checkout-button'
import { Eyebrow } from '@/components/ui/Eyebrow'

const COLOR = '#1F4D3F'

export default async function UpgradePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('dashboard.upgrade')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('plan, generations_used_this_month').eq('id', user!.id).single()

  if (profile?.plan === 'pro') redirect('/dashboard')

  const generationsLeft = Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))
  const overQuota = generationsLeft === 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
        <h1 className="section-h">{t('title')}</h1>
        {overQuota ? (
          <p className="text-sm mt-3" style={{ color: '#EF4444' }}>
            {t('quota')}
          </p>
        ) : (
          <p className="text-sm mt-3" style={{ color: 'var(--ink-700)' }}>
            {t('remaining', {count: generationsLeft})}
          </p>
        )}
      </div>

      {/* Pricing grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {/* Free plan */}
        <div
          className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('free')}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold" style={{ color: 'var(--ink)' }}>0&nbsp;€</span>
              <span className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('forever')}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {(t.raw('freeFeatures') as string[]).map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-400)' }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div
            className="py-3 rounded-xl text-center text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}
          >
            {t('currentPlan')}
          </div>
        </div>

        {/* Pro plan */}
        <div
          className="relative rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: COLOR + '08',
            border: `1.5px solid ${COLOR}`,
            boxShadow: `0 0 0 1px ${COLOR} inset`,
          }}
        >
          <span
            className="mono absolute top-5 right-5 text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full font-medium"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}30` }}
          >
            {t('recommended')}
          </span>
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('pro')}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold" style={{ color: 'var(--ink)' }}>4,99&nbsp;€</span>
              <span className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('month')}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {(t.raw('proFeatures') as string[]).map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: COLOR + '20', color: COLOR }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>
          <CheckoutButton />
        </div>
      </div>

      <p
        className="mono text-center text-xs animate-fade-up"
        style={{ color: 'var(--ink-400)', animationDelay: '90ms' }}
      >
        {t('footer')}
      </p>
    </div>
  )
}
