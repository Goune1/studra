'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift, X } from 'lucide-react'
import { CopyReferralLinkButton } from '@/components/referral/CopyReferralLinkButton'
import { trackReferralBannerDismissed, trackReferralBannerViewed } from '@/lib/analytics'
import styles from './referral-banner.module.css'

// Fermeture mémorisée par navigateur : pas de colonne en base, le bandeau peut
// réapparaître sur un autre appareil.
const DISMISSED_KEY = 'studra:referral-banner-dismissed'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function storeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Stockage indisponible (navigation privée stricte) : fermé pour cette visite seulement.
  }
}

export function ReferralBanner({ link }: { link: string }) {
  // Invisible tant que la préférence n'est pas lue : pas de flash pour ceux qui l'ont fermé.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readDismissed()) return
    // Lecture du navigateur, impossible pendant le rendu serveur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true)
    trackReferralBannerViewed()
  }, [])

  if (!visible) return null

  function dismiss() {
    storeDismissed()
    setVisible(false)
    trackReferralBannerDismissed()
  }

  return (
    <section className={styles.banner} aria-labelledby="referral-banner-title">
      <div className={styles.icon} aria-hidden="true">
        <Gift size={20} strokeWidth={1.5} />
      </div>
      <div className={styles.body}>
        <h2 id="referral-banner-title" className={styles.title}>Invite 2 amis, gagne 1 mois de Pro</h2>
        <p className={styles.summary}>
          Offert dès qu&apos;ils ont généré leur premier contenu, sans carte bancaire. Jusqu&apos;à 3 mois.
        </p>
        <div className={styles.actions}>
          <input className={styles.linkField} value={link} readOnly aria-label="Ton lien de parrainage" />
          <CopyReferralLinkButton link={link} source="dashboard_banner" />
          <Link href="/settings/parrainage" className={styles.progressLink}>Voir ma progression</Link>
        </div>
      </div>
      <button type="button" onClick={dismiss} className={styles.close} aria-label="Masquer le bandeau de parrainage">
        <X size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </section>
  )
}
