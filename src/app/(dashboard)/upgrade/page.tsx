import { Check } from '@phosphor-icons/react/dist/ssr'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '../billing/billing-actions'
import styles from '../billing/billing.module.css'

const FREE_FEATURES = ['5 générations IA par mois', 'Accès à tous les formats', 'Import PDF · texte · YouTube', 'Répétition espacée FSRS']
const PRO_FEATURES = ['Générations IA illimitées', 'Mode Socrate (maïeutique)', "Planning d'examen personnalisé", 'Analyse des lacunes avancée', 'Toutes les futures fonctionnalités']

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('plan, generations_used_this_month').eq('id', user!.id).single()

  if (profile?.plan === 'pro') redirect('/dashboard')

  const generationsLeft = Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))
  const overQuota = generationsLeft === 0

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Abonnement</p>
        <h1 className={styles.title}>Passe à la vitesse supérieure</h1>
        <p className={styles.summary}>Choisis le plan qui suit ton rythme de révision.</p>
        <p className={styles.quotaNotice}>
          {overQuota
            ? 'Tu as utilisé tes 5 générations ce mois-ci. Passe Pro pour continuer sans limite.'
            : `Il te reste ${generationsLeft} ${generationsLeft === 1 ? 'génération' : 'générations'} ce mois-ci.`}
        </p>
      </header>

      <section aria-label="Comparaison des abonnements" className={styles.planGrid}>
        <article className={`${styles.planCard} ${styles.freePlan}`}>
          <div className={styles.planTop}>
            <div>
              <p className={styles.sectionLabel}>Plan actuel</p>
              <h2 className={styles.planName}>Gratuit</h2>
            </div>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.price}>0 €</span>
            <span className={styles.priceSuffix}>/pour toujours</span>
          </div>
          <ul className={styles.planFeatures}>
            {FREE_FEATURES.map((feature) => (
              <li className={styles.planFeature} key={feature}>
                <Check aria-hidden="true" size={17} weight="bold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className={styles.planFooter}>
            <span className={styles.currentPlan}>Plan actuel</span>
          </div>
        </article>

        <article className={`${styles.planCard} ${styles.proPlan}`}>
          <div className={styles.planTop}>
            <div>
              <p className={styles.sectionLabel}>Pour réviser sans limite</p>
              <h2 className={styles.planName}>Pro</h2>
            </div>
            <span className={`${styles.status} ${styles.recommended}`}>Recommandé</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.price}>4,99 €</span>
            <span className={styles.priceSuffix}>/mois</span>
          </div>
          <ul className={styles.planFeatures}>
            {PRO_FEATURES.map((feature) => (
              <li className={styles.planFeature} key={feature}>
                <Check aria-hidden="true" size={17} weight="bold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className={styles.planFooter}>
            <CheckoutButton />
          </div>
        </article>
      </section>

      <p className={styles.legal}>Sans engagement · Annule en 1 clic depuis les paramètres · Paiement sécurisé via Stripe</p>
    </main>
  )
}
