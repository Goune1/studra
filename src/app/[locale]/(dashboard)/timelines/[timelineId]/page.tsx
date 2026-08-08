import type {Locale} from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TimelineViewer } from '@/components/timeline-viewer'
import { formatDate } from '@/lib/utils'
import type { TimelineData } from '@/types'
import { AlignLeft } from 'lucide-react'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { setRequestLocale } from 'next-intl/server'

const COLOR = '#1F4D3F'

const CAT_COLORS: Record<string, string> = {
  politique: '#B4503C', economique: '#A8762E', social: '#1F4D3F',
  culturel: '#3E6B7A', militaire: '#6B7280',
}

export default async function TimelinePage({ params }: { params: Promise<{ timelineId: string; locale: string }> }) {
  const { timelineId, locale } = await params
  setRequestLocale(locale as Locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: timeline } = await supabase
    .from('timelines').select('*').eq('id', timelineId).eq('user_id', user!.id).single()
  if (!timeline) notFound()

  const data = timeline.generated_data as TimelineData
  const events = data?.events ?? []
  const eventCount = events.length

  // Category breakdown
  const cats = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      const c = e.category ?? 'default'
      acc[c] = (acc[c] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)

  // Date range
  const dates = events.map((e) => e.date).filter(Boolean).sort()
  const dateSpan = dates.length ? (dates[0].slice(0, 4) === dates[dates.length - 1].slice(0, 4)
    ? dates[0].slice(0, 4)
    : `${dates[0].slice(0, 4)} — ${dates[dates.length - 1].slice(0, 4)}`)
    : '—'

  return (
    <div className="max-w-350">
      <div className="flex items-center justify-between mb-6">
        <Link href="/timelines" className="inline-flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--ink-500)' }}>
          <AlignLeft size={12} />← Mes frises
        </Link>
        <DeleteEntityButton
          table="timelines"
          id={timeline.id}
          entityLabel="cette frise"
          variant="button"
          redirectTo="/timelines"
        />
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {timeline.subject && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {timeline.subject}
            </span>
          )}
          <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
            {formatDate(timeline.created_at)}
          </span>
        </div>
        <h1 className="section-h leading-tight mb-5">
          {timeline.title}
        </h1>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
            {eventCount} événements
          </span>
          <span className="mono text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--ink-700)', border: '1px solid var(--ink-200)' }}>
            {dateSpan}
          </span>
          {cats.map(([cat, count]) => (
            <span key={cat} className="mono text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
              style={{ background: (CAT_COLORS[cat] ?? COLOR) + '15', color: CAT_COLORS[cat] ?? COLOR, border: `1px solid ${(CAT_COLORS[cat] ?? COLOR)}25` }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)} {count}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline viewer */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-elev)', borderColor: 'var(--ink-200)' }}>
        <TimelineViewer data={data} />
      </div>
    </div>
  )
}
