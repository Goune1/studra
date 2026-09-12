import Link from 'next/link'
import {
  ArrowRight,
  CalendarBlank,
  Cards,
  CheckCircle,
  Plus,
} from '@phosphor-icons/react/dist/ssr'
import type { DashboardData } from '@/lib/dashboard/queries'
import styles from './dashboard.module.css'

const MIN_REVIEWS_RETENTION = 10

const CREATE_TOOLS = [
  { href: '/flashcards/new', label: 'Flashcards' },
  { href: '/fiches/new', label: 'Fiche' },
  { href: '/schemas/new', label: 'Schéma' },
  { href: '/timelines/new', label: 'Frise' },
  { href: '/exams/new', label: 'Examen' },
  { href: '/socrate/new', label: 'Socrate' },
]

export function DashboardActive({ data, dateLabel }: { data: DashboardData; dateLabel: string }) {
  const { user, dueCards, dueDecks, reviewEstimateMin, todayTasks, week, upcomingExams } = data
  const planningTasks = todayTasks.filter((task) => task.kind === 'planning')
  const nextPlannedTask = planningTasks[0]
  const remainingPlanningTasks = nextPlannedTask ? planningTasks.slice(1) : []
  const hasDue = dueCards > 0
  const activityCount = planningTasks.length + (hasDue ? 1 : 0)
  const plannedMinutes = planningTasks.reduce((sum, task) => sum + task.durationMin, 0)
  const totalMinutes = plannedMinutes + (hasDue ? reviewEstimateMin : 0)
  const firstExam = upcomingExams[0]
  const examDateLabel = firstExam
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(firstExam.examDate))
    : null

  const primaryHref = nextPlannedTask
    ? nextPlannedTask.href
    : hasDue
      ? dueDecks.length === 1
        ? `/flashcards/${dueDecks[0].deckId}/study`
        : '/flashcards'
      : '/flashcards/new'

  const primaryLabel = nextPlannedTask ? 'Prochaine session' : hasDue ? 'Révision espacée' : 'Pour commencer'
  const primaryTitle = nextPlannedTask?.title ?? (hasDue ? 'Revoir ce qui commence à s’oublier' : 'Préparer un nouveau cours')
  const primaryDetail = nextPlannedTask
    ? `${nextPlannedTask.subtitle} · ${nextPlannedTask.durationMin} min`
    : hasDue
      ? `${dueCards} carte${dueCards > 1 ? 's' : ''} dans ${dueDecks.length} deck${dueDecks.length > 1 ? 's' : ''} · ${reviewEstimateMin} min`
      : 'Importe un document, une photo, un texte ou une vidéo.'
  const primaryAction = activityCount > 0 ? 'Commencer' : 'Importer un cours'
  const hasQueue = remainingPlanningTasks.length > 0 || Boolean(nextPlannedTask && hasDue)
  const hasReliableRetention = week.retentionRate !== null && week.totalReviews >= MIN_REVIEWS_RETENTION

  return (
    <div className={styles.dashboard}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.pageContext}>Tableau de bord</p>
          <p className={styles.date}>{dateLabel.toLowerCase()}</p>
        </div>
        <div className={styles.meta}>
          {user.plan === 'pro' && <span>Pro</span>}
        </div>
      </header>

      <section className={styles.dashboardIntro} aria-labelledby="dashboard-title">
        <div>
          <h1 id="dashboard-title" className={styles.dashboardTitle}>Bonjour {user.name}.</h1>
          <p className={styles.dashboardSummary}>
            {activityCount > 0
              ? `${activityCount} session${activityCount > 1 ? 's' : ''} au programme, environ ${totalMinutes} min.`
              : "Rien d'urgent aujourd'hui. Tu peux préparer la suite."}
          </p>
        </div>
      </section>

      <div className={styles.workGrid}>
        <section className={styles.nextCard} aria-labelledby="next-title">
          <div className={styles.cardTopline}>
            <span>{primaryLabel}</span>
            <span>{nextPlannedTask ? 'Planifiée aujourd’hui' : hasDue ? 'À faire aujourd’hui' : 'Quand tu veux'}</span>
          </div>
          <div className={styles.nextCardBody}>
            <div className={styles.activityMark} aria-hidden="true">
              {nextPlannedTask ? <CheckCircle size={25} weight="regular" /> : <Cards size={25} weight="regular" />}
            </div>
            <div className={styles.nextCopy}>
              <h2 id="next-title">{primaryTitle}</h2>
              <p>{primaryDetail}</p>
            </div>
          </div>
          <div className={styles.nextCardFooter}>
            <span>{nextPlannedTask ? 'Selon ton planning.' : hasDue ? 'Une seule session, tous les decks.' : 'Tu gardes la main sur le format.'}</span>
            <Link href={primaryHref} className={styles.primaryAction}>
              {primaryAction}
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <aside className={styles.examCard} aria-labelledby="exam-card-title">
          <div className={styles.examCardIcon} aria-hidden="true"><CalendarBlank size={20} /></div>
          {firstExam ? (
            <>
              <p className={styles.cardLabel}>Prochaine échéance</p>
              <h2 id="exam-card-title">{firstExam.title}</h2>
              <p className={styles.examCountdown}>J-{firstExam.daysLeft}</p>
              <div className={styles.examFooter}>
                <span>le {examDateLabel}</span>
                <Link href={`/planning/${firstExam.planId}`}>Voir le planning</Link>
              </div>
            </>
          ) : (
            <>
              <p className={styles.cardLabel}>Prochaine échéance</p>
              <h2 id="exam-card-title">Aucune date renseignée</h2>
              <p className={styles.examEmpty}>Ajoute ton prochain examen pour construire un programme réaliste.</p>
              <Link href="/planning" className={styles.inlineLink}>Ajouter une date <ArrowRight size={14} /></Link>
            </>
          )}
        </aside>
      </div>

      {hasQueue && (
        <section className={styles.queueCard} aria-labelledby="queue-title">
          <div className={styles.queueHeading}>
            <div>
              <p className={styles.cardLabel}>Programme du jour</p>
              <h2 id="queue-title">Ensuite</h2>
            </div>
            <span>{remainingPlanningTasks.length + (nextPlannedTask && hasDue ? 1 : 0)} session{remainingPlanningTasks.length + (nextPlannedTask && hasDue ? 1 : 0) > 1 ? 's' : ''}</span>
          </div>
          <div className={styles.queueRows}>
            {remainingPlanningTasks.map((task) => (
              <Link key={task.id} href={task.href} className={styles.queueRow}>
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.subtitle}</small>
                </span>
                <span className={styles.queueMeta}>{task.durationMin} min <ArrowRight size={14} /></span>
              </Link>
            ))}
            {nextPlannedTask && hasDue && (
              <Link href="/flashcards" className={styles.queueRow}>
                <span>
                  <strong>Révision espacée</strong>
                  <small>{dueCards} carte{dueCards > 1 ? 's' : ''} dans {dueDecks.length} deck{dueDecks.length > 1 ? 's' : ''}</small>
                </span>
                <span className={styles.queueMeta}>{reviewEstimateMin} min <ArrowRight size={14} /></span>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className={styles.supportCard} aria-label="Rythme et outils">
        <div className={styles.rhythmBlock}>
          <p className={styles.cardLabel}>Ton rythme</p>
          {week.totalReviews > 0 ? (
            <p className={styles.rhythmSentence}>
              <strong>{week.totalReviews}</strong> carte{week.totalReviews > 1 ? 's' : ''} revue{week.totalReviews > 1 ? 's' : ''} en 30 jours
              {hasReliableRetention && <> · <strong>{week.retentionRate}%</strong> retenues</>}
              {week.streakDays > 0 && <> · <strong>{week.streakDays} j</strong> de suite</>}.
            </p>
          ) : (
            <p className={styles.rhythmSentence}>Ta progression apparaîtra après tes premières sessions.</p>
          )}
        </div>
        <div className={styles.toolsBlock}>
          <p className={styles.cardLabel}>Travailler autrement</p>
          <div className={styles.boxedTools}>
            {CREATE_TOOLS.map(({ href, label }) => (
              <Link key={href} href={href} className={styles.boxedTool}>
                <Plus size={12} weight="bold" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
