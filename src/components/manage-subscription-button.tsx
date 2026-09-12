'use client'

import { useState } from 'react'
import { ArrowSquareOut, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import styles from './billing-button.module.css'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handlePortal() {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
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
    <button type="button" onClick={handlePortal} disabled={loading} className={`${styles.button} ${styles.secondary}`}>
      {loading ? <CircleNotch size={15} className={styles.spinner} /> : <ArrowSquareOut size={15} />}
      {loading ? 'Redirection…' : 'Gérer mon abonnement'}
    </button>
  )
}
