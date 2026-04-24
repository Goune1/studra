'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlignLeft, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import type { Timeline, TimelineEvent } from '@/types'

const COLOR = '#8B5CF6'
const MATIERES = ['Tous', 'SES', 'HGGSP', 'Maths', 'Histoire', 'Physique', 'Autre']
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = { date_desc: 'Date ↓', date_asc: 'Date ↑', alpha: 'Titre A→Z' }

const CAT_COLORS: Record<string, string> = {
  politique: '#EF4444', economique: '#F59E0B', social: '#22C55E',
  culturel: '#8B5CF6', militaire: '#6B7280', default: '#8B5CF6',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
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
              borderColor: '#0C0C10',
            }} />
        ))}
      </div>
    </div>
  )
}

export default function TimelinesPage() {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [matiere, setMatiere] = useState('Tous')
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
    if (matiere !== 'Tous') list = list.filter((t) => t.subject === matiere)
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [timelines, search, matiere, sort])

  return (
    <div className="max-w-350">
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl text-white tracking-tight" style={{  }}>Mes Frises</h1>
          <span className="text-xs px-2 py-1 rounded-full font-semibold tabular-nums"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}>
            {loading ? '…' : timelines.length} frise{timelines.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link href="/timelines/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:-translate-y-0.5 hover:opacity-90"
          style={{ background: COLOR }}>
          <PlusCircle size={15} />Nouvelle frise
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une frise…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#475569] outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {MATIERES.map((m) => (
            <button key={m} onClick={() => setMatiere(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{ background: matiere === m ? COLOR + '20' : 'transparent', color: matiere === m ? COLOR : 'var(--text-3)', border: matiere === m ? `1px solid ${COLOR}30` : '1px solid transparent' }}>
              {m}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-white"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {SORT_LABELS[sort]}<ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10 min-w-35"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, label]) => (
                <button key={k} onClick={() => { setSort(k); setSortOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors"
                  style={{ color: sort === k ? COLOR : 'var(--text-2)' }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && timelines.length === 0 ? (
        <EmptyState Icon={AlignLeft} color={COLOR} title="Aucune frise"
          subtitle="Créez votre première frise chronologique à partir de votre cours d'histoire"
          ctaLabel="Créer ma première frise" ctaHref="/timelines/new" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((timeline, i) => {
            const events = (timeline.generated_data?.events ?? []) as TimelineEvent[]
            const range = dateRange(events)
            return (
              <Link key={timeline.id} href={`/timelines/${timeline.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 animate-fade-up"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', animationDelay: `${i * 40}ms`, borderLeft: `4px solid ${COLOR}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <AlignLeft size={15} style={{ color: COLOR }} />
                    </div>
                    {timeline.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: COLOR + '12', color: COLOR }}>{timeline.subject}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-3 line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors"
                    style={{  }}>{timeline.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: COLOR + '10', color: COLOR, fontFamily: 'var(--font-mono, monospace)' }}>
                      {events.length} événements
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {range}
                    </span>
                  </div>
                  <div className="flex-1 flex items-end pb-1"><MiniTimeline events={events} /></div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-deep)' }}>
                  <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{formatDate(timeline.created_at)}</span>
                  <span className="text-[10px] font-semibold group-hover:text-purple-300 transition-colors" style={{ color: COLOR }}>Ouvrir →</span>
                </div>
              </Link>
            )
          })}
          {!loading && filtered.length === 0 && timelines.length > 0 && (
            <div className="col-span-full text-center py-16 text-[#475569] text-sm">Aucune frise ne correspond à votre recherche.</div>
          )}
        </div>
      )}
    </div>
  )
}
