import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TimelineViewer } from '@/components/timeline-viewer'
import { formatDate } from '@/lib/utils'
import type { TimelineData } from '@/types'
import { AlignLeft } from 'lucide-react'

const COLOR = '#8B5CF6'

const CAT_COLORS: Record<string, string> = {
  politique: '#EF4444', economique: '#F59E0B', social: '#22C55E',
  culturel: '#8B5CF6', militaire: '#6B7280',
}

export default async function TimelinePage({ params }: { params: Promise<{ timelineId: string }> }) {
  const { timelineId } = await params
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
      <Link href="/timelines" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors mb-6">
        <AlignLeft size={12} />← Mes frises
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {timeline.subject && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {timeline.subject}
            </span>
          )}
          <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            {formatDate(timeline.created_at)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl text-white leading-tight mb-5 tracking-tight" style={{  }}>
          {timeline.title}
        </h1>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}>
            {eventCount} événements
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)' }}>
            {dateSpan}
          </span>
          {cats.map(([cat, count]) => (
            <span key={cat} className="text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
              style={{ background: (CAT_COLORS[cat] ?? COLOR) + '15', color: CAT_COLORS[cat] ?? COLOR, border: `1px solid ${(CAT_COLORS[cat] ?? COLOR)}25`, fontFamily: 'var(--font-mono, monospace)' }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)} {count}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline viewer */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <TimelineViewer data={data} />
      </div>
    </div>
  )
}
