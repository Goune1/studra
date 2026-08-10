'use client'

import { Check, Loader2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

type UpdateMarketingConsentResult = {
  ok: boolean
  error?: string
}

type MarketingConsentToggleProps = {
  initialValue: boolean
  updateMarketingConsent: (marketingConsent: boolean) => Promise<UpdateMarketingConsentResult>
}

export function MarketingConsentToggle({
  initialValue,
  updateMarketingConsent,
}: MarketingConsentToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('dashboard.settings')

  function handleToggle() {
    const nextValue = !enabled
    setEnabled(nextValue)

    startTransition(async () => {
      const result = await updateMarketingConsent(nextValue)

      if (!result.ok) {
        setEnabled(!nextValue)
        toast.error(result.error)
        return
      }

      toast.success(nextValue ? t('marketingEnabled') : t('marketingDisabled'))
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={t('marketingAriaLabel')}
      disabled={isPending}
      onClick={handleToggle}
      className="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-0.5 transition-all duration-200 focus:outline-none disabled:cursor-wait disabled:opacity-75"
      style={{
        background: enabled ? 'var(--accent)' : 'var(--surface-2)',
        borderColor: enabled ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <span
        className={`absolute inset-y-0.5 flex w-7 items-center justify-center rounded-full bg-white text-[#13131A] shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
        ) : enabled ? (
          <Check size={14} strokeWidth={2.5} />
        ) : (
          <X size={14} strokeWidth={2.5} className="text-slate-500" />
        )}
      </span>
      <span
        className={`absolute left-2 h-1.5 w-1.5 rounded-full bg-white/70 transition-opacity ${
          enabled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span
        className={`absolute right-2 h-1.5 w-1.5 rounded-full bg-white/20 transition-opacity ${
          enabled ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </button>
  )
}
