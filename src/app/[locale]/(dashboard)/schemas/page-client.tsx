'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { GitBranch, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Schema } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#1F4D3F'
const MATIERE_KEYS = ['all', 'ses', 'hggsp', 'maths', 'history', 'physics', 'other'] as const
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_KEYS: Record<SortKey, 'dateDesc' | 'dateAsc' | 'alpha'> = { date_desc: 'dateDesc', date_asc: 'dateAsc', alpha: 'alpha' }

function MiniGraph({ seed }: { seed: number }) {
  const n = Math.max(4, Math.min(7, seed))
  const w = 80, h = 50
  const dots: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const rx = (w / 2 - 8) * (i % 2 === 0 ? 0.85 : 0.55)
    const ry = (h / 2 - 6) * (i % 2 === 0 ? 0.85 : 0.55)
    dots.push({ x: w / 2 + rx * Math.cos(angle), y: h / 2 + ry * Math.sin(angle) })
  }
  const edges: [number, number][] = []
  for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n])
  if (n > 4) edges.push([0, Math.floor(n / 2)])
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      {edges.map(([a, b], i) => (
        <line key={i} x1={dots[a].x} y1={dots[a].y} x2={dots[b].x} y2={dots[b].y}
          stroke={COLOR} strokeWidth={0.8} strokeOpacity={0.35} />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={i === 0 ? 4 : 2.5}
          fill={i === 0 ? COLOR : 'transparent'} stroke={COLOR}
          strokeWidth={i === 0 ? 0 : 1} strokeOpacity={0.7} />
      ))}
    </svg>
  )
}

export default function SchemasPage() {
  const t = useTranslations('dashboard.schemas')
  const format = useFormatter()
  const [schemas, setSchemas] = useState<Schema[]>([])
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
      const { data } = await supabase.from('schemas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setSchemas((data as Schema[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = schemas
    if (search) list = list.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    if (matiere !== 'all') list = list.filter((s) => s.subject === t(`subjects.${matiere}` as never))
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [schemas, search, matiere, sort, t])

  return (
    <div className="max-w-350">
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="section-h">{t('title')}</h1>
            <span className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {loading ? '…' : t('count', {count: schemas.length})}
            </span>
          </div>
        </div>
        <Link href="/schemas/new" className="btn btn-primary shrink-0">
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

      {!loading && schemas.length === 0 ? (
        <EmptyState Icon={GitBranch} color={COLOR} title={t('empty.title')}
          subtitle={t('empty.subtitle')}
          ctaLabel={t('new')} ctaHref="/schemas/new" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((schema, i) => {
            const nodeCount = schema.generated_data?.nodes?.length ?? 0
            const edgeCount = schema.generated_data?.edges?.length ?? 0
            return (
              <div
                key={schema.id}
                className="relative group/card animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute top-3 right-3 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                  <DeleteEntityButton
                    table="schemas"
                    id={schema.id}
                    entityLabel={t('detail.entityLabel')}
                    variant="icon"
                    color={COLOR}
                    onDeleted={(id) => setSchemas((prev) => prev.filter((s) => s.id !== id))}
                  />
                </div>
              <Link href={`/schemas/${schema.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3 transition-[padding] duration-200 group-hover/card:pr-9">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <GitBranch size={15} style={{ color: COLOR }} />
                    </div>
                    {schema.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: COLOR + '12', color: COLOR }}>{schema.subject}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold mb-3 line-clamp-2 leading-snug transition-colors" style={{ color: 'var(--ink)' }}>
                    {schema.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--accent-soft)', color: COLOR }}>
                      {nodeCount} nœuds
                    </span>
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--surface-2)', color: 'var(--ink-500)' }}>
                      {edgeCount} relations
                    </span>
                  </div>
                  <div className="flex-1 flex items-end"><MiniGraph seed={nodeCount} /></div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--ink-200)', background: 'var(--surface-2)' }}>
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>{format.dateTime(new Date(schema.created_at), {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                  <span className="text-[10px] font-semibold" style={{ color: COLOR }}>{t('open')}</span>
                </div>
              </Link>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && schemas.length > 0 && (
            <div className="col-span-full text-center py-16 text-sm" style={{ color: 'var(--ink-400)' }}>{t('empty.search')}</div>
          )}
        </div>
      )}
    </div>
  )
}
