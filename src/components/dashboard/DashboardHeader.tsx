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
        <span className="text-sm text-zinc-500 tabular-nums">{dateLabel}</span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {user.plan === 'free' ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs tabular-nums ${
              overQuota ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            {overQuota && <span className="w-1.5 h-1.5 rounded-full bg-[#C26868]" />}
            {user.generationsUsed}/{user.generationsQuota} générations
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C7AE8]" />
            Pro
          </span>
        )}
      </div>
    </header>
  )
}
