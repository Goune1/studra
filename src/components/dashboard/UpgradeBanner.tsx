'use client'

import { Check, ArrowRight } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import styles from './dashboard.module.css'

const FEATURES = [
  'Générations IA illimitées',
  'Mode Socrate (maïeutique)',
  "Planning d'examen personnalisé",
  'Analyse des lacunes avancée',
  'Toutes les futures fonctionnalités',
]

export function UpgradeBanner({ generationsUsed, generationsQuota }: {
  generationsUsed: number
  generationsQuota: number
}) {
  const [loading, setLoading] = useState(false)
  const left = Math.max(0, generationsQuota - generationsUsed)
  const overQuota = left === 0

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
    <section className={styles.upgradeBanner} aria-labelledby="upgrade-title">
      <div>
        <p className={styles.upgradeKicker}>Studra Pro</p>
        <h2 id="upgrade-title" className={styles.upgradeTitle}>4,99&nbsp;€/mois</h2>
        {overQuota ? (
          <p className={styles.upgradeCopy}>
            Tu as utilisé tes {generationsQuota} générations ce mois-ci. Passe Pro pour continuer sans limite.
          </p>
        ) : (
          <p className={styles.upgradeCopy}>
            Il te reste <strong>{left} génération{left > 1 ? 's' : ''}</strong> ce mois-ci. Passe Pro pour des générations illimitées.
          </p>
        )}
        <ul className={styles.upgradeFeatures}>
          {FEATURES.map((feature) => (
            <li key={feature}>
              <Check size={14} weight="bold" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className={`${styles.primaryAction} ${styles.upgradeAction}`}
        >
          {loading ? 'Redirection…' : 'Passer Pro'}
          {!loading && <ArrowRight size={16} weight="bold" aria-hidden="true" />}
        </button>
        <span className={styles.upgradeNote}>Sans engagement · Annule en 1 clic</span>
      </div>
    </section>
  )
}
