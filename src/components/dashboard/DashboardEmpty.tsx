import Link from 'next/link'
import {
  ArrowRight,
  Camera,
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

const IMPORT_OPTIONS: { href: string; label: string; Icon: Icon }[] = [
  { href: '/flashcards/new', label: 'Coller un texte', Icon: TextT },
  { href: '/flashcards/new', label: 'Importer un PDF', Icon: FilePdf },
  { href: '/flashcards/new', label: 'Prendre un cours en photo', Icon: Camera },
  { href: '/flashcards/new', label: 'Utiliser une vidéo YouTube', Icon: LinkSimple },
]

export function DashboardEmpty({ user, dateLabel, upcomingExams }: Props) {
  return (
    <div className={styles.dashboard}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.pageContext}>Tableau de bord</p>
          <p className={styles.date}>{dateLabel.toLowerCase()}</p>
        </div>
      </header>

      <section className={styles.emptyIntro} aria-labelledby="empty-title">
        <div>
          <p className={styles.kicker}>Première session</p>
          <h1 id="empty-title" className={styles.emptyTitle}>Bienvenue, {user.name}. Commence avec un cours.</h1>
          <p className={styles.emptySubtitle}>
            Studra le transforme en cartes de révision. Tu relis, tu corriges, puis tu peux commencer à mémoriser.
          </p>
        </div>
        <aside className={styles.emptyAside}>
          <p>
            Pas besoin de tout configurer. Un extrait de cours suffit pour voir si la méthode te convient.
          </p>
        </aside>
      </section>

      <section className={styles.importer} aria-labelledby="import-title">
        <div>
          <h2 id="import-title" className={styles.importerTitle}>Choisis ce que tu as sous la main</h2>
          <p className={styles.importerText}>
            Texte, document, photo ou vidéo : le format change, pas le résultat.
          </p>
          <div className={styles.importOptions}>
            {IMPORT_OPTIONS.map(({ href, label, Icon }) => (
              <Link key={label} href={href} className={styles.importOption}>
                <Icon size={18} weight="regular" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.importAction}>
          <Link href="/flashcards/new" className={styles.primaryAction}>
            Créer mon premier deck
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
          <span className={styles.example}>
            Rien à importer ?{' '}
            <Link href="/flashcards">Ouvre le deck d’exemple de philo</Link>
          </span>
        </div>
      </section>

      {upcomingExams.length === 0 && (
        <section className={styles.deadline} aria-labelledby="deadline-title">
          <h2 id="deadline-title" className={styles.sectionTitle}>Une échéance en vue ?</h2>
          <p>Ajoute ton bac ou tes partiels. Studra pourra ensuite répartir les révisions dans ton planning.</p>
          <Link href="/planning" className={styles.secondaryAction}>Ajouter une date</Link>
        </section>
      )}
    </div>
  )
}
