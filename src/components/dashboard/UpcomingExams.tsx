import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { UpcomingExam } from '@/lib/dashboard/queries'

function urgencyColor(daysLeft: number): string {
  if (daysLeft <= 3) return '#B4503C'
  if (daysLeft <= 7) return '#A8762E'
  return 'var(--accent)'
}

export function UpcomingExams({ exams }: { exams: UpcomingExam[] }) {
  if (exams.length === 0) {
    return (
      <section>
        <Eyebrow className="mb-4">Prochains examens</Eyebrow>
        <div className="app-card p-5">
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
            Aucun examen prévu.
          </p>
          <Link
            href="/planning/new"
            className="inline-block mt-3 text-xs transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Créer un plan de révision →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section>
      <Eyebrow className="mb-4">Prochains examens</Eyebrow>
      <ul className="app-card overflow-hidden">
        {exams.slice(0, 3).map((e, i) => (
          <li key={e.planId} style={i > 0 ? { borderTop: '1px solid var(--ink-200)' } : undefined}>
            <Link
              href={`/planning/${e.planId}`}
              className="flex flex-col gap-2 px-5 py-4 transition-colors group hover:bg-black/[0.02]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium truncate transition-colors" style={{ color: 'var(--ink)' }}>
                  {e.title}
                </span>
                <span className="mono text-xs tabular-nums flex-shrink-0" style={{ color: urgencyColor(e.daysLeft) }}>
                  {e.daysLeft === 0 ? "Aujourd'hui" : `J-${e.daysLeft}`}
                </span>
              </div>
              <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--ink-200)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${e.progress}%`,
                    backgroundColor: urgencyColor(e.daysLeft),
                  }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
