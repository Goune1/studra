'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TimelineEvent, TimelineData } from '@/types'

const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
  politique:   { color: '#3b82f6', bg: '#1e3a5f', label: 'Politique' },
  militaire:   { color: '#ef4444', bg: '#7f1d1d', label: 'Militaire' },
  economique:  { color: '#f59e0b', bg: '#78350f', label: 'Économique' },
  social:      { color: '#22c55e', bg: '#14532d', label: 'Social' },
  culturel:    { color: '#a855f7', bg: '#4a1d96', label: 'Culturel' },
  default:     { color: '#6b7280', bg: '#1f2937', label: 'Autre' },
}

function CardContent({
  event,
  config,
}: {
  event: TimelineEvent
  config: { color: string; bg: string; label: string }
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="cursor-pointer rounded-xl border transition-all duration-200 hover:brightness-110 overflow-hidden"
      style={{ backgroundColor: config.bg + '70', borderColor: config.color + '40' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
            style={{ backgroundColor: config.color + '25', color: config.color }}
          >
            {event.date}{event.end_date ? ` — ${event.end_date}` : ''}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: config.color + '15', color: config.color + 'cc' }}
          >
            {config.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: config.color + '99', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      <p className="font-semibold text-white text-sm px-4 pb-3 leading-snug">{event.title}</p>
      {expanded && event.description && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: config.color + '25' }}>
          <p className="text-gray-300 text-xs leading-relaxed">{event.description}</p>
        </div>
      )}
    </div>
  )
}

function EventRow({
  event,
  index,
  visible,
}: {
  event: TimelineEvent
  index: number
  visible: boolean
}) {
  const config = categoryConfig[event.category ?? 'default'] ?? categoryConfig.default
  const isRight = index % 2 !== 0

  const dot = (
    <div
      className="w-3 h-3 rounded-full flex-shrink-0 ring-2"
      style={{ backgroundColor: config.color }}
    />
  )

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* ── Mobile: dot + card ─────────────────────────── */}
      <div className="flex items-start gap-3 md:hidden">
        <div className="flex-shrink-0 mt-[18px]">{dot}</div>
        <div className="flex-1 min-w-0">
          <CardContent event={event} config={config} />
        </div>
      </div>

      {/* ── Desktop: 3-col grid [card | dot | card] ────── */}
      <div className="hidden md:grid md:grid-cols-[1fr_40px_1fr] md:items-center md:gap-x-0">
        {/* Left cell */}
        <div className={`pr-5 ${isRight ? '' : ''}`}>
          {!isRight && <CardContent event={event} config={config} />}
        </div>

        {/* Center: dot only */}
        <div className="flex justify-center items-start pt-[18px]">
          {dot}
        </div>

        {/* Right cell */}
        <div className="pl-5">
          {isRight && <CardContent event={event} config={config} />}
        </div>
      </div>
    </div>
  )
}

export function TimelineViewer({ data }: { data: TimelineData }) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const refs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) setVisibleIds((prev) => new Set([...prev, id]))
          }
        })
      },
      { threshold: 0.05 }
    )
    refs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [data.events])

  const usedCategories = [...new Set(data.events.map((e) => e.category ?? 'default'))]
  const filtered = activeFilter
    ? data.events.filter((e) => (e.category ?? 'default') === activeFilter)
    : data.events

  return (
    <div className="p-4 sm:p-6">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter(null)}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
          style={{
            backgroundColor: activeFilter === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
            color: activeFilter === null ? '#fff' : '#6b7280',
            border: `1px solid ${activeFilter === null ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          Tous
        </button>
        {usedCategories.map((cat) => {
          const c = categoryConfig[cat] ?? categoryConfig.default
          const active = activeFilter === cat
          return (
            <button key={cat} onClick={() => setActiveFilter(active ? null : cat)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={{
                backgroundColor: active ? c.color + '30' : c.color + '12',
                color: active ? c.color : c.color + 'aa',
                border: `1px solid ${active ? c.color + '60' : c.color + '25'}`,
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Mobile line */}
        <div className="absolute top-0 bottom-0 w-px md:hidden"
          style={{ left: '5px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 5%, rgba(255,255,255,0.1) 95%, transparent)' }}
        />
        {/* Desktop center line */}
        <div className="absolute top-0 bottom-0 w-px hidden md:block"
          style={{ left: 'calc(50% - 0.5px)', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 5%, rgba(255,255,255,0.1) 95%, transparent)' }}
        />

        <div className="pl-5 md:pl-0 space-y-4 md:space-y-5">
          {filtered.map((event, i) => (
            <div
              key={event.id}
              data-id={event.id}
              ref={(el) => { if (el) refs.current.set(event.id, el) }}
            >
              <EventRow event={event} index={i} visible={visibleIds.has(event.id)} />
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-10">Aucun événement dans cette catégorie.</p>
      )}
    </div>
  )
}
