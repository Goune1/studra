'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GitBranch, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import type { Schema } from '@/types'

const COLOR = '#10B981'
const MATIERES = ['Tous', 'SES', 'HGGSP', 'Maths', 'Histoire', 'Physique', 'Autre']
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = { date_desc: 'Date ↓', date_asc: 'Date ↑', alpha: 'Titre A→Z' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
  const [schemas, setSchemas] = useState<Schema[]>([])
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
    if (matiere !== 'Tous') list = list.filter((s) => s.subject === matiere)
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [schemas, search, matiere, sort])

  return (
    <div className="max-w-350">
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl text-white tracking-tight" style={{  }}>Mes Schémas</h1>
          <span className="text-xs px-2 py-1 rounded-full font-semibold tabular-nums"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}>
            {loading ? '…' : schemas.length} schéma{schemas.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link href="/schemas/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:-translate-y-0.5 hover:opacity-90"
          style={{ background: COLOR }}>
          <PlusCircle size={15} />Nouveau schéma
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un schéma…"
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

      {!loading && schemas.length === 0 ? (
        <EmptyState Icon={GitBranch} color={COLOR} title="Aucun schéma"
          subtitle="Créez votre premier schéma conceptuel à partir de votre cours"
          ctaLabel="Créer mon premier schéma" ctaHref="/schemas/new" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((schema, i) => {
            const nodeCount = schema.generated_data?.nodes?.length ?? 0
            const edgeCount = schema.generated_data?.edges?.length ?? 0
            return (
              <Link key={schema.id} href={`/schemas/${schema.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 animate-fade-up"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', animationDelay: `${i * 40}ms`, borderLeft: `4px solid ${COLOR}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <GitBranch size={15} style={{ color: COLOR }} />
                    </div>
                    {schema.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: COLOR + '12', color: COLOR }}>{schema.subject}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-3 line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors"
                    style={{  }}>
                    {schema.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: COLOR + '10', color: COLOR, fontFamily: 'var(--font-mono, monospace)' }}>
                      {nodeCount} nœuds
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {edgeCount} relations
                    </span>
                  </div>
                  <div className="flex-1 flex items-end"><MiniGraph seed={nodeCount} /></div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-deep)' }}>
                  <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{formatDate(schema.created_at)}</span>
                  <span className="text-[10px] font-semibold group-hover:text-emerald-300 transition-colors" style={{ color: COLOR }}>Ouvrir →</span>
                </div>
              </Link>
            )
          })}
          {!loading && filtered.length === 0 && schemas.length > 0 && (
            <div className="col-span-full text-center py-16 text-[#475569] text-sm">Aucun schéma ne correspond à votre recherche.</div>
          )}
        </div>
      )}
    </div>
  )
}
