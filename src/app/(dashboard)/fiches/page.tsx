'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import type { Fiche } from '@/types'
import { trackFichesOpen } from '@/lib/analytics'

const COLOR = '#3B82F6'
const MATIERES = ['Tous', 'SES', 'HGGSP', 'Maths', 'Histoire', 'Physique', 'Autre']
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = {
  date_desc: 'Date ↓',
  date_asc: 'Date ↑',
  alpha: 'Titre A→Z',
}

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function excerpt(content: string, maxLen = 120): string {
  const plain = content.replace(/#{1,6}\s+/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + '…' : plain
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FichesPage() {
  const [fiches, setFiches] = useState<Fiche[]>([])
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
      trackFichesOpen(user.id)
      const { data } = await supabase
        .from('fiches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setFiches((data as Fiche[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = fiches
    if (search) list = list.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()))
    if (matiere !== 'Tous') list = list.filter((f) => f.subject === matiere)
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [fiches, search, matiere, sort])

  return (
    <div className="max-w-350">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl text-white tracking-tight" style={{  }}>
            Mes Fiches
          </h1>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold tabular-nums"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}
          >
            {loading ? '…' : fiches.length} fiche{fiches.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link
          href="/fiches/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:-translate-y-0.5 hover:opacity-90"
          style={{ background: COLOR }}
        >
          <PlusCircle size={15} />
          Nouvelle fiche
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une fiche…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#475569] outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {MATIERES.map((m) => (
            <button
              key={m}
              onClick={() => setMatiere(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: matiere === m ? COLOR + '20' : 'transparent',
                color: matiere === m ? COLOR : 'var(--text-3)',
                border: matiere === m ? `1px solid ${COLOR}30` : '1px solid transparent',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-[#94A3B8] transition-colors hover:text-white"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {SORT_LABELS[sort]}
            <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10 min-w-35"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { setSort(k); setSortOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                  style={{ color: sort === k ? COLOR : 'var(--text-2)' }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {!loading && fiches.length === 0 ? (
        <EmptyState
          Icon={FileText}
          color={COLOR}
          title="Aucune fiche"
          subtitle="Créez votre première fiche à partir de votre cours"
          ctaLabel="Créer ma première fiche"
          ctaHref="/fiches/new"
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((fiche, i) => {
            const wc = wordCount(fiche.generated_content)
            return (
              <Link
                key={fiche.id}
                href={`/fiches/${fiche.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 animate-fade-up"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  animationDelay: `${i * 40}ms`,
                  borderLeft: `4px solid ${COLOR}`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div className="flex flex-col flex-1 p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <FileText size={15} style={{ color: COLOR }} />
                    </div>
                    {fiche.subject && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: COLOR + '12', color: COLOR }}
                      >
                        {fiche.subject}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#93C5FD] transition-colors"
                    style={{  }}
                  >
                    {fiche.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed flex-1">
                    {excerpt(fiche.generated_content)}
                  </p>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-t"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-deep)' }}
                >
                  <span
                    className="text-[10px] text-[#475569] tabular-nums"
                    style={{ fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    {formatDate(fiche.created_at)}
                  </span>
                  <span
                    className="text-[10px] text-[#475569] tabular-nums"
                    style={{ fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    ~{wc} mots
                  </span>
                  <span className="text-[10px] font-semibold transition-colors group-hover:text-[#93C5FD]" style={{ color: COLOR }}>
                    Lire →
                  </span>
                </div>
              </Link>
            )
          })}

          {!loading && filtered.length === 0 && fiches.length > 0 && (
            <div className="col-span-full text-center py-16 text-[#475569] text-sm">
              Aucune fiche ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
