import { Lock, Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { Profile } from '@/types'

interface ProGateProps {
  profile: Profile
  children: React.ReactNode
}

export function ProGate({ profile, children }: ProGateProps) {
  const t = useTranslations('common.proGate')
  if (profile.plan === 'pro') return <>{children}</>

  const features = [
    t('features.generations'),
    t('features.socrate'),
    t('features.gaps'),
  ]

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="app-card w-full max-w-lg p-8 text-center sm:p-10">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Lock size={22} strokeWidth={1.75} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        </div>

        <h2 className="section-h">{t('title')}</h2>

        <p
          className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed"
          style={{ color: 'var(--ink-700)' }}
        >
          {t('description')}
        </p>

        <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-[15px]"
              style={{ color: 'var(--ink-700)' }}
            >
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-soft)' }}
              >
                <Check size={12} strokeWidth={2.5} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <Link href="/upgrade" className="btn btn-primary btn-lg mt-8 w-full sm:w-auto">
          {t('cta')}
        </Link>
      </div>
    </div>
  )
}
