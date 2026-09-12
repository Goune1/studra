'use client'

import { useState } from 'react'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import styles from './billing-button.module.css'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
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
    <button type="button" onClick={handleCheckout} disabled={loading} className={styles.button}>
      {loading ? <CircleNotch size={15} className={styles.spinner} /> : <ArrowRight size={15} />}
      {loading ? 'Redirection…' : 'Passer en Pro · 4,99 €/mois'}
    </button>
  )
}
