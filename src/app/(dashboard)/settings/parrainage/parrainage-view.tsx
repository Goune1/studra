import {
  MAX_REWARDED_MONTHS,
  REFERRALS_PER_MONTH,
  type ReferralHistoryItem,
  type ReferralSummary,
} from '@/lib/referral-summary'
import { CopyLinkButton } from './copy-link-button'
import settingsStyles from '../settings.module.css'
import styles from './parrainage.module.css'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function statusLabel(item: ReferralHistoryItem): string {
  switch (item.status) {
    case 'pending':
      return 'En attente de sa première génération'
    case 'qualified':
      return `Qualifié le ${dateFormat.format(new Date(item.qualifiedAt!))}`
    case 'rewarded':
      return item.rewardSequence ? `Compté dans ton mois offert n°${item.rewardSequence}` : 'Compté dans un mois offert'
    case 'over_cap':
      return 'Qualifié, au-delà du plafond de 3 mois'
  }
}

interface ParrainageViewProps {
  link: string | null
  summary: ReferralSummary
  offeredProUntil: string | null
}

export function ParrainageView({ link, summary, offeredProUntil }: ParrainageViewProps) {
  return (
    <div className={settingsStyles.page}>
      <header className={settingsStyles.pageHeader}>
        <p className={settingsStyles.eyebrow}>Paramètres</p>
        <h1>Parrainage</h1>
        <p className={settingsStyles.pageSummary}>
          Invite tes amis sur Studra. Dès que deux d&apos;entre eux ont créé leur compte et généré un premier contenu,
          tu gagnes un mois de Pro, sans carte bancaire. Jusqu&apos;à {MAX_REWARDED_MONTHS} mois offerts.
        </p>
      </header>

      <div className={styles.stack}>
        <section className={settingsStyles.panel} aria-labelledby="referral-link-title">
          <div className={settingsStyles.panelHeader}>
            <div>
              <h2 id="referral-link-title">Ton lien</h2>
              <p>Partage-le : chaque personne qui s&apos;inscrit avec ce lien devient ton filleul.</p>
            </div>
          </div>
          <div className={styles.linkRow}>
            {link ? (
              <>
                <input className={styles.linkField} value={link} readOnly aria-label="Ton lien de parrainage" />
                <CopyLinkButton link={link} />
              </>
            ) : (
              <p className={styles.muted}>Ton lien n&apos;est pas encore disponible. Recharge la page dans un instant.</p>
            )}
          </div>
        </section>

        <section className={settingsStyles.panel} aria-labelledby="referral-progress-title">
          <div className={settingsStyles.panelHeader}>
            <div>
              <h2 id="referral-progress-title">Progression</h2>
              <p>{REFERRALS_PER_MONTH} filleuls qualifiés = 1 mois de Pro offert.</p>
            </div>
          </div>

          <div className={styles.progressBlock}>
            {summary.progress === null ? (
              <p className={styles.progressValue}>Plafond atteint</p>
            ) : (
              <p className={styles.progressValue}>
                {summary.progress}
                <span>/{REFERRALS_PER_MONTH} vers ton prochain mois</span>
              </p>
            )}
            <div className={styles.progressTrack} aria-hidden="true">
              {Array.from({ length: REFERRALS_PER_MONTH }, (_, index) => (
                <span
                  key={index}
                  className={styles.progressStep}
                  data-filled={summary.progress === null || index < summary.progress}
                />
              ))}
            </div>
          </div>

          <dl className={settingsStyles.infoList}>
            <div className={settingsStyles.infoRow}>
              <dt>Filleuls qualifiés</dt>
              <dd>{summary.qualifiedCount}</dd>
            </div>
            <div className={settingsStyles.infoRow}>
              <dt>Mois offerts obtenus</dt>
              <dd>{summary.monthsGranted} / {MAX_REWARDED_MONTHS}</dd>
            </div>
            <div className={settingsStyles.infoRow}>
              <dt>Pro offert</dt>
              <dd>{offeredProUntil ? `Jusqu'au ${dateFormat.format(new Date(offeredProUntil))}` : 'Aucun en cours'}</dd>
            </div>
          </dl>

          <p className={styles.footnote}>
            Les mois offerts s&apos;ajoutent les uns aux autres. Si tu t&apos;abonnes pendant un mois offert, l&apos;abonnement
            démarre tout de suite et court en parallèle : les jours offerts restants ne sont pas reportés.
          </p>
        </section>

        <section className={settingsStyles.panel} aria-labelledby="referral-history-title">
          <div className={settingsStyles.panelHeader}>
            <div>
              <h2 id="referral-history-title">Historique</h2>
              <p>Tes filleuls restent anonymes : seules les dates sont affichées.</p>
            </div>
          </div>
          {summary.history.length === 0 ? (
            <p className={styles.empty}>Personne ne s&apos;est encore inscrit avec ton lien.</p>
          ) : (
            <ol className={styles.history}>
              {summary.history.map((item) => (
                <li key={item.id} className={styles.historyRow} data-status={item.status}>
                  <div>
                    <p className={styles.historyTitle}>Filleul {item.position}</p>
                    <p className={styles.historyMeta}>Inscrit le {dateFormat.format(new Date(item.signedUpAt))}</p>
                  </div>
                  <p className={styles.historyStatus}>{statusLabel(item)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
