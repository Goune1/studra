import type { WeekStats } from '@/lib/dashboard/queries'

const ACCENT = '#7C7AE8'

function cellColor(count: number, max: number, isToday: boolean): string {
  if (isToday && count === 0) return 'rgba(124,122,232,0.15)'
  if (isToday) return ACCENT
  if (count === 0) return 'rgb(24,24,27)'
  const intensity = Math.min(1, count / Math.max(max, 1))
  if (intensity > 0.75) return 'rgb(124,122,232)'
  if (intensity > 0.5) return 'rgb(96,94,200)'
  if (intensity > 0.25) return 'rgb(68,66,155)'
  return 'rgb(44,43,100)'
}

export function WeekProgress({ week }: { week: WeekStats }) {
  const today = new Date().toISOString().slice(0, 10)
  const max = Math.max(1, ...week.heatmap.map((d) => d.count))
  const totalMonth = week.heatmap.reduce((s, d) => s + d.count, 0)

  return (
    <section>
      <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
        Cette semaine
      </p>

      <div className="rounded-xl border border-zinc-900 p-5 bg-zinc-950">
        {/* Heatmap */}
        <div className="flex items-end gap-[3px] mb-5 h-12">
          {week.heatmap.map((d) => {
            const isToday = d.date === today
            const height = Math.max(4, Math.round((d.count / Math.max(max, 1)) * 100))
            return (
              <div
                key={d.date}
                className="flex-1 rounded-sm transition-colors"
                style={{
                  height: `${height}%`,
                  backgroundColor: cellColor(d.count, max, isToday),
                }}
                title={`${d.date} — ${d.count} review${d.count > 1 ? 's' : ''}`}
              />
            )
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-zinc-900">
          <Stat
            value={week.retentionRate !== null ? `${week.retentionRate}%` : '—'}
            label="Rétention"
            color={week.retentionRate !== null ? (week.retentionRate >= 70 ? '#4ADE80' : week.retentionRate >= 50 ? '#D4A770' : '#C26868') : undefined}
          />
          <Stat
            value={totalMonth.toLocaleString('fr-FR')}
            label="Reviews 30j"
          />
          <Stat
            value={week.streakDays > 0 ? `${week.streakDays}j` : '—'}
            label="Streak"
            color={week.streakDays >= 3 ? '#F59E0B' : week.streakDays > 0 ? '#D4A770' : undefined}
          />
          <Stat
            value={week.examScoreAvg !== null ? `${week.examScoreAvg}%` : '—'}
            label="Score examens"
            color={week.examScoreAvg !== null ? (week.examScoreAvg >= 70 ? '#4ADE80' : week.examScoreAvg >= 50 ? '#D4A770' : '#C26868') : undefined}
          />
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <div
        className="text-lg font-semibold tabular-nums"
        style={{ color: color ?? 'rgb(244,244,245)' }}
      >
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.12em] mt-1">{label}</div>
    </div>
  )
}
