import Link from 'next/link'
import type { UpcomingExam } from '@/lib/dashboard/queries'

function urgencyColor(daysLeft: number): string {
  if (daysLeft <= 3) return '#C26868'
  if (daysLeft <= 7) return '#D4A770'
  return '#7C7AE8'
}

export function UpcomingExams({ exams }: { exams: UpcomingExam[] }) {
  if (exams.length === 0) {
    return (
      <section>
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
          Prochains examens
        </p>
        <div className="rounded-xl border border-zinc-900 p-5 bg-zinc-950">
          <p className="text-sm text-zinc-500">
            Aucun examen prévu.
          </p>
          <Link
            href="/planning/new"
            className="inline-block mt-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Créer un plan de révision →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section>
      <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
        Prochains examens
      </p>
      <ul className="rounded-xl border border-zinc-900 bg-zinc-950 divide-y divide-zinc-900">
        {exams.slice(0, 3).map((e) => (
          <li key={e.planId}>
            <Link
              href={`/planning/${e.planId}`}
              className="flex flex-col gap-2 px-5 py-4 hover:bg-zinc-900/40 transition-colors group"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-zinc-100 font-medium truncate group-hover:text-white transition-colors">
                  {e.title}
                </span>
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: urgencyColor(e.daysLeft) }}>
                  {e.daysLeft === 0 ? "Aujourd'hui" : `J-${e.daysLeft}`}
                </span>
              </div>
              <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
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
