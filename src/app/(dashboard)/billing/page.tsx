import { Check, Minus } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton, ManageSubscriptionButton } from './billing-actions'
import styles from './billing.module.css'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))
  const features = [
    { label: 'Flashcards illimitées', included: isPro },
    { label: 'Fiches illimitées', included: isPro },
    { label: 'Générations par mois', value: isPro ? 'Illimitées' : '5' },
  ]

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Compte</p>
        <h1 className={styles.title}>Abonnement</h1>
        <p className={styles.summary}>Retrouve ton plan actuel et gère ton accès à Studra.</p>
        {!isPro && (
          <p className={styles.quotaNotice}>
            {generationsLeft === 0
              ? 'Tu as utilisé toutes tes générations ce mois-ci.'
              : `Il te reste ${generationsLeft} ${generationsLeft === 1 ? 'génération' : 'générations'} ce mois-ci.`}
          </p>
        )}
      </header>

      <section aria-labelledby="current-plan-title" className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.sectionLabel}>Plan actuel</p>
            <h2 className={styles.panelTitle} id="current-plan-title">Studra {isPro ? 'Pro' : 'Gratuit'}</h2>
          </div>
          <span className={`${styles.status} ${isPro ? styles.statusPro : ''}`}>{isPro ? 'Pro' : 'Gratuit'}</span>
        </div>

        <ul className={styles.featureList}>
          {features.map((feature) => (
            <li className={styles.feature} key={feature.label}>
              <span>{feature.label}</span>
              {feature.value ? (
                <span className={styles.featureValue}>{feature.value}</span>
              ) : (
                <span className={`${styles.featureValue} ${feature.included ? styles.featureValueIncluded : ''}`}>
                  {feature.included ? <Check aria-label="Inclus" size={17} weight="bold" /> : <Minus aria-label="Non inclus" size={17} />}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.panelAction}>
          {!isPro ? <CheckoutButton /> : <ManageSubscriptionButton />}
        </div>
      </section>
    </main>
  )
}
