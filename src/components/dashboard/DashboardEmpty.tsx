import Link from 'next/link'
import {
  ArrowRight,
  CalendarBlank,
  Camera,
  Cards,
  FilePdf,
  LinkSimple,
  TextT,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import type { DashboardUser, UpcomingExam } from '@/lib/dashboard/queries'
import styles from './dashboard.module.css'

interface Props {
  user: DashboardUser
  dateLabel: string
  upcomingExams: UpcomingExam[]
}

const IMPORT_OPTIONS: { href: string; label: string; detail: string; Icon: Icon }[] = [
  { href: '/flashcards/new', label: 'Coller un texte', detail: 'Un extrait suffit', Icon: TextT },
  { href: '/flashcards/new', label: 'Importer un PDF', detail: 'Ton cours complet', Icon: FilePdf },
  { href: '/flashcards/new', label: 'Prendre une photo', detail: 'Depuis tes notes', Icon: Camera },
  { href: '/flashcards/new', label: 'Utiliser une vidéo', detail: 'Avec un lien YouTube', Icon: LinkSimple },
]

export function DashboardEmpty({ user, dateLabel, upcomingExams }: Props) {
  const firstExam = upcomingExams[0]
  const examDateLabel = firstExam
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(firstExam.examDate))
    : null

  return (
    <div className={styles.dashboard}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.pageContext}>Tableau de bord</p>
          <p className={styles.date}>{dateLabel.toLowerCase()}</p>
        </div>
      </header>

      <section className={styles.dashboardIntro} aria-labelledby="empty-title">
        <div>
          <h1 id="empty-title" className={styles.dashboardTitle}>Bonjour {user.name}.</h1>
          <p className={styles.dashboardSummary}>Ton espace est prêt. Commence par transformer un cours en cartes de révision.</p>
        </div>
      </section>

      <div className={styles.workGrid}>
        <section className={styles.nextCard} aria-labelledby="first-step-title">
          <div className={styles.cardTopline}>
            <span>Première étape</span>
            <span>Environ 2 min</span>
          </div>
          <div className={styles.nextCardBody}>
            <div className={styles.activityMark} aria-hidden="true">
              <Cards size={25} weight="regular" />
            </div>
            <div className={styles.nextCopy}>
              <h2 id="first-step-title">Crée ton premier deck à partir d’un cours</h2>
              <p>Importe ce que tu as déjà. Studra génère les cartes, puis tu gardes la main pour les relire et les corriger.</p>
            </div>
          </div>
          <div className={styles.nextCardFooter}>
            <span>Aucune configuration nécessaire.</span>
            <Link href="/flashcards/new" className={styles.primaryAction}>
              Importer un cours
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <aside className={styles.examCard} aria-labelledby="empty-exam-title">
          <div className={styles.examCardIcon} aria-hidden="true"><CalendarBlank size={20} /></div>
          {firstExam ? (
            <>
              <p className={styles.cardLabel}>Prochaine échéance</p>
              <h2 id="empty-exam-title">{firstExam.title}</h2>
              <p className={styles.examCountdown}>J-{firstExam.daysLeft}</p>
              <div className={styles.examFooter}>
                <span>le {examDateLabel}</span>
                <Link href={`/planning/${firstExam.planId}`}>Voir le planning</Link>
              </div>
            </>
          ) : (
            <>
              <p className={styles.cardLabel}>Prochaine échéance</p>
              <h2 id="empty-exam-title">Aucune date renseignée</h2>
              <p className={styles.examEmpty}>Ajoute ton prochain examen pour construire un programme réaliste.</p>
              <Link href="/planning" className={styles.inlineLink}>Ajouter une date <ArrowRight size={14} aria-hidden="true" /></Link>
            </>
          )}
        </aside>
      </div>

      <section className={styles.queueCard} aria-labelledby="sources-title">
        <div className={styles.queueHeading}>
          <div>
            <p className={styles.cardLabel}>Importer un cours</p>
            <h2 id="sources-title">Choisis ce que tu as sous la main</h2>
          </div>
          <span>4 formats</span>
        </div>
        <div className={styles.sourceRows}>
          {IMPORT_OPTIONS.map(({ href, label, detail, Icon }) => (
            <Link key={label} href={href} className={styles.sourceRow}>
              <Icon size={18} weight="regular" aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.supportCard} aria-label="Découvrir la méthode">
        <div className={styles.rhythmBlock}>
          <p className={styles.cardLabel}>Ce qui se passe ensuite</p>
          <p className={styles.rhythmSentence}>Relis les cartes générées, corrige ce qui doit l’être, puis lance une première session.</p>
        </div>
        <div className={styles.exampleBlock}>
          <p className={styles.cardLabel}>Pas de cours sous la main</p>
          <Link href="/flashcards" className={styles.inlineLink}>Ouvrir le deck d’exemple de philo <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  )
}
