import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { TodayTask } from '@/lib/dashboard/queries'

export function TodayList({ tasks }: { tasks: TodayTask[] }) {
  return (
    <section className="mb-12">
      <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
        À faire aujourd&apos;hui
      </p>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 border-t border-zinc-900">
          Aucune tâche aujourd&apos;hui.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={t.href}
                className="flex items-center gap-4 py-4 group focus:outline-none focus-visible:bg-zinc-900/50"
              >
                <div
                  className="w-0.5 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.kind === 'review' ? '#7C7AE8' : '#5BB8BD' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 font-medium truncate group-hover:text-white transition-colors">
                    {t.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {t.subtitle}
                  </p>
                </div>
                <span className="text-xs text-zinc-500 tabular-nums flex-shrink-0">
                  {t.durationMin} min
                </span>
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
