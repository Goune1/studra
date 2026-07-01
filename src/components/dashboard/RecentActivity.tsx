import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { RecentItem, ToolType } from '@/lib/dashboard/queries'

const TYPE_LABEL: Record<ToolType, string> = {
  flashcards: 'Flashcards',
  fiche: 'Fiche',
  schema: 'Schéma',
  frise: 'Frise',
  examen: 'Examen',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function RecentActivity({ items }: { items: RecentItem[] }) {
  if (items.length === 0) return null

  return (
    <section className="mb-12">
      <Eyebrow className="mb-4">Activité récente</Eyebrow>

      <ul className="border-t border-b" style={{ borderColor: 'var(--ink-200)' }}>
        {items.map((item, i) => (
          <li key={`${item.type}-${item.id}`} style={i > 0 ? { borderTop: '1px solid var(--ink-200)' } : undefined}>
            <Link
              href={item.href}
              className="flex items-center gap-4 py-3 group focus:outline-none"
            >
              <span className="flex-1 text-sm truncate transition-colors" style={{ color: 'var(--ink-700)' }}>
                {item.title}
              </span>
              <span
                className="mono text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 tracking-wide"
                style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
              >
                {TYPE_LABEL[item.type]}
              </span>
              <span className="mono text-xs tabular-nums flex-shrink-0 w-24 text-right" style={{ color: 'var(--ink-400)' }}>
                {relativeTime(item.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
