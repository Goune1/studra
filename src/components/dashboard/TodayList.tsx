import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { TodayTask } from '@/lib/dashboard/queries'

export function TodayList({ tasks }: { tasks: TodayTask[] }) {
  return (
    <section className="mb-12">
      <Eyebrow className="mb-4">À faire aujourd&apos;hui</Eyebrow>

      {tasks.length === 0 ? (
        <p className="text-sm py-6 border-t" style={{ color: 'var(--ink-500)', borderColor: 'var(--ink-200)' }}>
          Aucune tâche aujourd&apos;hui.
        </p>
      ) : (
        <ul className="border-t border-b" style={{ borderColor: 'var(--ink-200)' }}>
          {tasks.map((t, i) => (
            <li key={t.id} style={i > 0 ? { borderTop: '1px solid var(--ink-200)' } : undefined}>
              <Link
                href={t.href}
                className="flex items-center gap-4 py-4 group focus:outline-none"
              >
                <div
                  className="w-0.5 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.kind === 'review' ? 'var(--accent)' : 'var(--ink-400)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate transition-colors" style={{ color: 'var(--ink)' }}>
                    {t.title}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {t.subtitle}
                  </p>
                </div>
                <span className="mono text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--ink-500)' }}>
                  {t.durationMin} min
                </span>
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: 'var(--ink-400)' }}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
