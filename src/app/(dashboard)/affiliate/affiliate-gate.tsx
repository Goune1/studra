'use client'

import { useActionState } from 'react'
import { Lock, Users } from '@phosphor-icons/react'
import { unlockAffiliate } from './actions'
import styles from './affiliate.module.css'

export function AffiliateGate() {
  const [error, action, pending] = useActionState(unlockAffiliate, null)
  return (
    <main className={styles.gate}>
      <header className={styles.gateHeader}>
        <p className={styles.context}><Users size={15} weight="regular" /> Affiliation</p>
        <h1>Bientôt disponible</h1>
        <p>Le programme d’affiliation est en cours de déploiement. Il sera disponible prochainement pour tous les utilisateurs.</p>
      </header>
      <section className={styles.gatePanel}>
        <h2>Accès bêta</h2>
        <p>Tu as un accès anticipé&nbsp;? Entre le mot de passe pour continuer.</p>
        <form action={action} className={styles.form}>
          <div className={styles.field}>
            <Lock size={15} weight="regular" />
            <input type="password" name="password" placeholder="Mot de passe" required autoComplete="off" aria-label="Mot de passe" />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={pending} className={styles.submit}>{pending ? 'Vérification…' : 'Accéder'}</button>
        </form>
      </section>
    </main>
  )
}
