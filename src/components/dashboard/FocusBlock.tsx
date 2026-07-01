import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { DashboardUser, DueDeck, TodayTask } from '@/lib/dashboard/queries'

interface FocusBlockProps {
  user: DashboardUser
  dueCards: number
  dueDecks: DueDeck[]
  reviewEstimateMin: number
  todayTasks: TodayTask[]
}

export function FocusBlock({ user, dueCards, dueDecks, reviewEstimateMin, todayTasks }: FocusBlockProps) {
  const planningCount = todayTasks.filter((t) => t.kind === 'planning').length
  const totalMinutes = todayTasks.reduce((s, t) => s + t.durationMin, 0)

  const hasNothing = dueCards === 0 && planningCount === 0

  let primaryHref = '/flashcards'
  let primaryLabel = 'Commencer'
  if (dueCards > 0 && dueDecks.length === 1) {
    primaryHref = `/flashcards/${dueDecks[0].deckId}/study`
  } else if (dueCards > 0) {
    primaryHref = '/flashcards'
  } else if (todayTasks.length > 0) {
    primaryHref = todayTasks[0].href
    primaryLabel = 'Démarrer la session'
  } else {
    primaryHref = '/flashcards/new'
    primaryLabel = 'Créer un deck'
  }

  return (
    <section className="mb-16">
      <h1
        className="font-medium tracking-tight leading-[1.0]"
        style={{ color: 'var(--ink)', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.035em' }}
      >
        Bonjour {user.name}.
      </h1>

      <p className="mt-4 lede max-w-2xl">
        {hasNothing ? (
          <>Tout est à jour. Reviens demain ou crée du nouveau contenu.</>
        ) : dueCards > 0 && planningCount > 0 ? (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{dueCards} carte{dueCards > 1 ? 's' : ''}</span> à réviser et{' '}
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{planningCount} session{planningCount > 1 ? 's' : ''}</span> planifiée{planningCount > 1 ? 's' : ''}
            <span className="dim"> · environ {totalMinutes} min</span>
          </>
        ) : dueCards > 0 ? (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{dueCards} carte{dueCards > 1 ? 's' : ''}</span> à réviser
            <span className="dim"> · environ {reviewEstimateMin} min</span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{planningCount} session{planningCount > 1 ? 's' : ''}</span> planifiée{planningCount > 1 ? 's' : ''} aujourd&apos;hui
            <span className="dim"> · {totalMinutes} min</span>
          </>
        )}
      </p>

      <div className="mt-8">
        <Button href={primaryHref}>
          {primaryLabel}
          <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </section>
  )
}
