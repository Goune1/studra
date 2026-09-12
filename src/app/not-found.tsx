import type { Metadata } from 'next'
import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import styles from './status-page.module.css'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function NotFound() {
  return (
    <div className={`app-v2 ${styles.page}`}>
      <div className={styles.inner}>
        <Eyebrow className={styles.eyebrow}>{"Erreur 404"}</Eyebrow>
        <h1 className={styles.title}>Page introuvable</h1>
        <p className={styles.body}>
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primary}>
            Retour au tableau de bord
          </Link>
          <Link href="/" className={styles.secondary}>
            Page d&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
