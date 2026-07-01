import { Eyebrow } from '@/components/ui/Eyebrow'
import type { WeekStats } from '@/lib/dashboard/queries'

const ACCENT = '#1F4D3F'

function cellColor(count: number, max: number, isToday: boolean): string {
  if (isToday && count === 0) return 'rgba(31,77,63,0.18)'
  if (isToday) return ACCENT
  if (count === 0) return 'var(--ink-200)'
  const intensity = Math.min(1, count / Math.max(max, 1))
  if (intensity > 0.75) return '#1F4D3F'
  if (intensity > 0.5) return '#3D6B5C'
  if (intensity > 0.25) return '#6B9183'
  return '#A7C2B8'
}

export function WeekProgress({ week }: { week: WeekStats }) {
  const today = new Date().toISOString().slice(0, 10)
  const max = Math.max(1, ...week.heatmap.map((d) => d.count))
  const totalMonth = week.heatmap.reduce((s, d) => s + d.count, 0)

  return (
    <section>
      <Eyebrow className="mb-4">Cette semaine</Eyebrow>

      <div className="app-card p-5">
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
        <div className="grid grid-cols-4 gap-2 pt-4 border-t" style={{ borderColor: 'var(--ink-200)' }}>
          <Stat
            value={week.retentionRate !== null ? `${week.retentionRate}%` : '—'}
            label="Rétention"
            color={week.retentionRate !== null ? (week.retentionRate >= 70 ? '#1F4D3F' : week.retentionRate >= 50 ? '#A8762E' : '#B4503C') : undefined}
          />
          <Stat
            value={totalMonth.toLocaleString('fr-FR')}
            label="Reviews 30j"
          />
          <Stat
            value={week.streakDays > 0 ? `${week.streakDays}j` : '—'}
            label="Streak"
            color={week.streakDays >= 3 ? '#1F4D3F' : week.streakDays > 0 ? '#A8762E' : undefined}
          />
          <Stat
            value={week.examScoreAvg !== null ? `${week.examScoreAvg}%` : '—'}
            label="Score examens"
            color={week.examScoreAvg !== null ? (week.examScoreAvg >= 70 ? '#1F4D3F' : week.examScoreAvg >= 50 ? '#A8762E' : '#B4503C') : undefined}
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
        style={{ color: color ?? 'var(--ink)' }}
      >
        {value}
      </div>
      <div className="mono text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: 'var(--ink-400)' }}>
        {label}
      </div>
    </div>
  )
}
