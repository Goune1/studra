'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)
  const t = useTranslations('dashboard.billing')

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? t('checkoutError'))
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
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-colors"
      style={{ background: '#1F4D3F', color: '#ffffff' }}
      onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#2a6854')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#1F4D3F')}
    >
      {loading ? t('redirecting') : t('upgradeButton')}
    </button>
  )
}
