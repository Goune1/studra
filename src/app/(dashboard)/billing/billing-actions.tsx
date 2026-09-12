'use client'

import { ArrowRight, GearSix, SpinnerGap } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import styles from './billing.module.css'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors du checkout')
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className={styles.primaryAction} disabled={loading} onClick={handleCheckout}>
      {loading ? <SpinnerGap aria-hidden="true" className={styles.spinner} size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
      {loading ? 'Redirection...' : 'Passer en Pro — 4,99 €/mois'}
    </button>
  )
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Une erreur est survenue')
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className={styles.secondaryAction} disabled={loading} onClick={handlePortal}>
      {loading ? <SpinnerGap aria-hidden="true" className={styles.spinner} size={18} /> : <GearSix aria-hidden="true" size={18} />}
      {loading ? 'Redirection...' : 'Gérer mon abonnement'}
    </button>
  )
}
