'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const t = useTranslations('dashboard.billing')

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? t('genericError'))
        return
      }

      window.location.href = data.url
    } catch {
      toast.error(t('genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-white font-semibold text-lg transition-colors"
    >
      {loading ? t('redirecting') : t('manageButton')}
    </button>
  )
}
