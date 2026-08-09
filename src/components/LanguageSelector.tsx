'use client'

import {Globe2} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'
import {useTransition} from 'react'
import {toast} from 'sonner'
import {getPathname, usePathname} from '@/i18n/navigation'
import {locales, type AppLocale} from '@/i18n/pathname'
import {setLocalePreference} from '@/app/[locale]/locale-actions'
import {cn} from '@/lib/utils'

const localeKeys = {
  fr: 'locales.fr',
  en: 'locales.en',
  es: 'locales.es',
  pt: 'locales.pt',
  de: 'locales.de',
  it: 'locales.it',
} as const

type LanguageSelectorProps = {
  className?: string
  showLabel?: boolean
}

export function LanguageSelector({
  className,
  showLabel = false,
}: LanguageSelectorProps) {
  const t = useTranslations('languageSelector')
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return

    startTransition(async () => {
      const result = await setLocalePreference(nextLocale)
      if (!result.ok) {
        toast.error(t('saveError'))
      }
      const suffix = `${window.location.search}${window.location.hash}`
      const localizedPathname = getPathname({href: pathname, locale: nextLocale})
      window.location.assign(`${localizedPathname}${suffix}`)
    })
  }

  return (
    <label className={cn('inline-flex items-center gap-2', className)}>
      <Globe2 size={16} aria-hidden="true" style={{color: 'var(--ink-400)'}} />
      {showLabel && (
        <span className="text-sm font-medium" style={{color: 'var(--ink-700)'}}>
          {t('label')}
        </span>
      )}
      <span className="sr-only">{t('label')}</span>
      <select
        aria-label={t('label')}
        value={locale}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as AppLocale)}
        className="rounded-lg border bg-transparent px-2 py-1.5 text-sm font-medium outline-none transition-colors disabled:opacity-60"
        style={{color: 'var(--ink-700)', borderColor: 'var(--ink-200)'}}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {t(localeKeys[option])}
          </option>
        ))}
      </select>
    </label>
  )
}
