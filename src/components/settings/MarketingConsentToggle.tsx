'use client'

import { Check, Loader2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

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

      toast.success(nextValue ? 'Emails marketing activés' : 'Emails marketing désactivés')
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Autoriser les emails marketing"
      disabled={isPending}
      onClick={handleToggle}
      className="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-[#13131A] disabled:cursor-wait disabled:opacity-75"
      style={{
        background: enabled ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : 'var(--surface-2)',
        borderColor: enabled ? 'rgba(168, 85, 247, 0.55)' : 'var(--border-2)',
        boxShadow: enabled ? '0 0 18px rgba(124, 58, 237, 0.22)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        className={`absolute inset-y-0.5 flex w-7 items-center justify-center rounded-full bg-white text-[#13131A] shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin text-violet-600" />
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
