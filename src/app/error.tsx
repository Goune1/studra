'use client'

import Link from 'next/link'
import { Warning } from '@phosphor-icons/react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import styles from './status-page.module.css'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className={`app-v2 ${styles.page}`}>
      <div className={styles.inner}>
        <div className={styles.iconBox}>
          <Warning size={24} weight="regular" />
        </div>
        <Eyebrow className={styles.eyebrow}>{"Erreur"}</Eyebrow>
        <h1 className={styles.title}>Quelque chose s&apos;est mal passé</h1>
        <p className={styles.body}>
          Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou revenir au
          tableau de bord.
        </p>
        <div className={styles.actions}>
          <button onClick={reset} className={styles.primary}>
            Réessayer
          </button>
          <Link href="/dashboard" className={styles.secondary}>
            Retour au tableau de bord
          </Link>
        </div>
        {error.digest && <p className={styles.digest}>Code&nbsp;: {error.digest}</p>}
      </div>
    </div>
  )
}
