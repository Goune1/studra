import type { DashboardUser } from '@/lib/dashboard/queries'

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function DashboardHeader({ user }: { user: DashboardUser }) {
  const now = new Date()
  const dateLabel = `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`
  const overQuota = user.plan === 'free' && user.generationsUsed >= user.generationsQuota

  return (
    <header className="flex items-center justify-between gap-4 mb-12">
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="mono text-xs tabular-nums" style={{ color: 'var(--ink-500)' }}>
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {user.plan === 'free' ? (
          <span
            className="mono inline-flex items-center gap-1.5 text-xs tabular-nums"
            style={{ color: overQuota ? '#B4503C' : 'var(--ink-500)' }}
          >
            {overQuota && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#B4503C' }} />}
            {user.generationsUsed}/{user.generationsQuota} générations
          </span>
        ) : (
          <span
            className="mono inline-flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--ink-500)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            Pro
          </span>
        )}
      </div>
    </header>
  )
}
