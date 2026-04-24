import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
      <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight leading-tight">
        Bonjour {user.name}.
      </h1>

      <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
        {hasNothing ? (
          <>Tout est à jour. Reviens demain ou crée du nouveau contenu.</>
        ) : dueCards > 0 && planningCount > 0 ? (
          <>
            <span className="text-zinc-100 font-medium">{dueCards} carte{dueCards > 1 ? 's' : ''}</span> à réviser et{' '}
            <span className="text-zinc-100 font-medium">{planningCount} session{planningCount > 1 ? 's' : ''}</span> planifiée{planningCount > 1 ? 's' : ''}
            <span className="text-zinc-600"> · environ {totalMinutes} min</span>
          </>
        ) : dueCards > 0 ? (
          <>
            <span className="text-zinc-100 font-medium">{dueCards} carte{dueCards > 1 ? 's' : ''}</span> à réviser
            <span className="text-zinc-600"> · environ {reviewEstimateMin} min</span>
          </>
        ) : (
          <>
            <span className="text-zinc-100 font-medium">{planningCount} session{planningCount > 1 ? 's' : ''}</span> planifiée{planningCount > 1 ? 's' : ''} aujourd&apos;hui
            <span className="text-zinc-600"> · {totalMinutes} min</span>
          </>
        )}
      </p>

      <div className="mt-8">
        <Link
          href={primaryHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7C7AE8] hover:bg-[#9593F0] text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7AE8] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {primaryLabel}
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  )
}
