'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlignLeft, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Timeline, TimelineEvent } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#1F4D3F'
const MATIERE_KEYS = ['all', 'ses', 'hggsp', 'maths', 'history', 'physics', 'other'] as const
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_KEYS: Record<SortKey, 'dateDesc' | 'dateAsc' | 'alpha'> = { date_desc: 'dateDesc', date_asc: 'dateAsc', alpha: 'alpha' }

// Catégories d'événements — désaturées, cohérentes avec le système
const CAT_COLORS: Record<string, string> = {
  politique: '#B4503C', economique: '#A8762E', social: '#1F4D3F',
  culturel: '#3E6B7A', militaire: '#6B7280', default: '#1F4D3F',
}

function dateRange(events: TimelineEvent[]): string {
  if (!events.length) return '—'
  const dates = events.map((e) => e.date).filter(Boolean).sort()
  const first = dates[0]?.slice(0, 4)
  const last = dates[dates.length - 1]?.slice(0, 4)
  return first === last ? first : `${first} — ${last}`
}

function MiniTimeline({ events }: { events: TimelineEvent[] }) {
  const dots = events.slice(0, 5)
  return (
    <div className="flex items-center gap-0 w-full py-2">
      <div className="flex-1 relative h-0.5" style={{ background: COLOR + '25' }}>
        {dots.map((_, i) => (
          <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2"
            style={{
              left: `${(i / Math.max(dots.length - 1, 1)) * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: CAT_COLORS[dots[i]?.category ?? 'default'] ?? COLOR,
              borderColor: 'var(--bg-elev)',
            }} />
        ))}
      </div>
    </div>
  )
}

export default function TimelinesPage() {
  const t = useTranslations('dashboard.timelines')
  const format = useFormatter()
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [matiere, setMatiere] = useState('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('timelines').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setTimelines((data as Timeline[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = timelines
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    if (matiere !== 'all') list = list.filter((timeline) => timeline.subject === t(`subjects.${matiere}` as never))
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [timelines, search, matiere, sort, t])

  return (
    <div className="max-w-350">
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="section-h">{t('title')}</h1>
            <span className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {loading ? '…' : t('count', {count: timelines.length})}
            </span>
          </div>
        </div>
        <Link href="/timelines/new" className="btn btn-primary shrink-0">
          <PlusCircle size={15} />{t('new')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}>
          {MATIERE_KEYS.map((key) => (
            <button key={key} onClick={() => setMatiere(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{ background: matiere === key ? 'var(--accent-soft)' : 'transparent', color: matiere === key ? COLOR : 'var(--ink-500)', border: matiere === key ? `1px solid ${COLOR}30` : '1px solid transparent' }}>
              {t(`subjects.${key}`)}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}>
            {t(`sort.${SORT_KEYS[sort]}`)}<ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10 min-w-35"
              style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}>
              {(Object.keys(SORT_KEYS) as SortKey[]).map((k) => (
                <button key={k} onClick={() => { setSort(k); setSortOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-black/[0.03] transition-colors"
                  style={{ color: sort === k ? COLOR : 'var(--ink-700)' }}>{t(`sort.${SORT_KEYS[k]}`)}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && timelines.length === 0 ? (
        <EmptyState Icon={AlignLeft} color={COLOR} title={t('empty.title')}
          subtitle={t('empty.subtitle')}
          ctaLabel={t('new')} ctaHref="/timelines/new" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((timeline, i) => {
            const events = (timeline.generated_data?.events ?? []) as TimelineEvent[]
            const range = dateRange(events)
            return (
              <div
                key={timeline.id}
                className="relative group/card animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute top-3 right-3 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                  <DeleteEntityButton
                    table="timelines"
                    id={timeline.id}
                    entityLabel={t('detail.entityLabel')}
                    variant="icon"
                    color={COLOR}
                    onDeleted={(id) => setTimelines((prev) => prev.filter((t) => t.id !== id))}
                  />
                </div>
              <Link href={`/timelines/${timeline.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3 transition-[padding] duration-200 group-hover/card:pr-9">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <AlignLeft size={15} style={{ color: COLOR }} />
                    </div>
                    {timeline.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: COLOR + '12', color: COLOR }}>{timeline.subject}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold mb-3 line-clamp-2 leading-snug transition-colors" style={{ color: 'var(--ink)' }}>{timeline.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--accent-soft)', color: COLOR }}>
                      {t('detail.events', {count: events.length})}
                    </span>
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--surface-2)', color: 'var(--ink-500)' }}>
                      {range}
                    </span>
                  </div>
                  <div className="flex-1 flex items-end pb-1"><MiniTimeline events={events} /></div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--ink-200)', background: 'var(--surface-2)' }}>
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>{format.dateTime(new Date(timeline.created_at), {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                  <span className="text-[10px] font-semibold" style={{ color: COLOR }}>{t('open')}</span>
                </div>
              </Link>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && timelines.length > 0 && (
            <div className="col-span-full text-center py-16 text-sm" style={{ color: 'var(--ink-400)' }}>{t('empty.search')}</div>
          )}
        </div>
      )}
    </div>
  )
}
