import Link from 'next/link'
import { Brain, CaretRight, Check, X } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '@/components/checkout-button'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'
import { MarketingConsentToggle } from '@/components/settings/MarketingConsentToggle'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { updateMarketingConsent, deleteAccount } from './actions'
import styles from './settings.module.css'

export default async function SettingsPage() {
  const format = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Compte</p>
        <h1>Paramètres</h1>
        <p className={styles.pageSummary}>Gère ton compte, ton abonnement et les réglages de révision.</p>
      </header>

      <div className={styles.settingsGrid}>
        <section className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Profil</h2>
              <p>Les informations associées à ton compte Studra.</p>
            </div>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Nom complet</dt>
              <dd>{profile?.full_name ?? 'Non renseigné'}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Membre depuis</dt>
              <dd>{profile?.created_at ? format.format(new Date(profile.created_at)) : '—'}</dd>
            </div>
          </dl>
          <div className={`${styles.settingRow} ${styles.preferenceRow}`}>
            <div className={styles.preferenceCopy}>
              <p>Emails marketing</p>
              <span>Recevoir les actualités et offres Studra par email.</span>
            </div>
            <MarketingConsentToggle initialValue={profile?.marketing_consent ?? false} updateMarketingConsent={updateMarketingConsent} />
          </div>
        </section>

        <Link href="/settings/revision" className={styles.revisionLink}>
          <span className={styles.revisionIcon}><Brain size={19} weight="regular" /></span>
          <span>
            <h2>Répétition espacée</h2>
            <p>FSRS, rétention cible et prévisions.</p>
          </span>
          <CaretRight size={17} weight="regular" />
        </Link>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Abonnement</h2>
              <p>Ton accès actuel à Studra.</p>
            </div>
            <span className={`${styles.planBadge} ${isPro ? styles.proBadge : ''}`}>{isPro ? 'Pro' : 'Gratuit'}</span>
          </div>
          {!isPro && (
            <p className={styles.usageNotice}>
              {generationsLeft === 0
                ? 'Tu as utilisé toutes tes générations ce mois-ci.'
                : `Il te reste ${generationsLeft!} ${generationsLeft === 1 ? 'génération' : 'générations'} ce mois-ci.`}
            </p>
          )}
          <div className={styles.featureList}>
            {[
              { label: 'Flashcards illimitées', included: isPro },
              { label: 'Fiches illimitées', included: isPro },
              { label: 'Générations par mois', value: isPro ? 'Illimitées' : '5' },
            ].map((item) => (
              <div key={item.label} className={styles.featureRow}>
                <span>{item.label}</span>
                {item.value ? <strong className={styles.rowValue}>{item.value}</strong> : (
                  <span className={`${styles.featureStatus} ${item.included ? styles.featureAvailable : styles.featureUnavailable}`}>
                    {item.included ? <Check size={15} weight="bold" /> : <X size={15} weight="bold" />}
                    {item.included ? 'Inclus' : 'Pro'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.subscriptionAction}>{!isPro ? <CheckoutButton /> : <ManageSubscriptionButton />}</div>
        </section>

        <section className={`${styles.panel} ${styles.dangerPanel} ${styles.widePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Supprimer mon compte</h2>
              <p className={styles.panelDescription}>Supprime définitivement ton compte Studra et toutes tes données. Cette action est irréversible.</p>
            </div>
          </div>
          <div className={styles.dangerAction}>
            <DeleteAccountButton userEmail={user!.email ?? ''} deleteAccount={deleteAccount} />
          </div>
        </section>
      </div>
    </div>
  )
}
