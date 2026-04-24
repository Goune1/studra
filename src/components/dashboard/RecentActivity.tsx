import Link from 'next/link'
import type { RecentItem, ToolType } from '@/lib/dashboard/queries'

const TYPE_LABEL: Record<ToolType, string> = {
  flashcards: 'Flashcards',
  fiche: 'Fiche',
  schema: 'Schéma',
  frise: 'Frise',
  examen: 'Examen',
}

const TYPE_COLOR: Record<ToolType, string> = {
  flashcards: '#7C7AE8',
  fiche: '#5BB8BD',
  schema: '#E8A87C',
  frise: '#68C26A',
  examen: '#C26868',
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
      <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
        Activité récente
      </p>

      <ul className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="flex items-center gap-4 py-3 group focus:outline-none focus-visible:bg-zinc-900/50"
            >
              <span className="flex-1 text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                {item.title}
              </span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  color: TYPE_COLOR[item.type],
                  backgroundColor: `${TYPE_COLOR[item.type]}18`,
                }}
              >
                {TYPE_LABEL[item.type]}
              </span>
              <span className="text-xs text-zinc-600 tabular-nums flex-shrink-0 w-24 text-right">
                {relativeTime(item.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
