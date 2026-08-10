'use client'

import { useEffect, useState, useMemo } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Fiche } from '@/types'
import { trackFichesOpen } from '@/lib/analytics'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { useFormatter, useTranslations } from 'next-intl'

const COLOR = '#1F4D3F'
const MATIERES = ['all', 'SES', 'HGGSP', 'Maths', 'Histoire', 'Physique', 'Autre']
type SortKey = 'date_desc' | 'date_asc' | 'alpha'

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function excerpt(content: string, maxLen = 120): string {
  const plain = content.replace(/#{1,6}\s+/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + '…' : plain
}

export default function FichesPage() {
  const t = useTranslations('fiches')
  const format = useFormatter()
  const [fiches, setFiches] = useState<Fiche[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [matiere, setMatiere] = useState('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const supabase = createClient()
  const sortLabels: Record<SortKey, string> = {
    date_desc: t('sort.dateDesc'),
    date_asc: t('sort.dateAsc'),
    alpha: t('sort.alpha'),
  }

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
    if (matiere !== 'all') list = list.filter((f) => f.subject === matiere)
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
        <div>
          <Eyebrow className="mb-2">{t('title')}</Eyebrow>
          <div className="flex items-center gap-3">
          <h1 className="section-h">{t('mine')}</h1>
            <span
              className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}
            >
              {loading ? '…' : t('count', {count: fiches.length})}
            </span>
          </div>
        </div>
        <Link href="/fiches/new" className="btn btn-primary shrink-0">
          <PlusCircle size={15} />
          {t('new')}
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
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
              {t(`subjects.${m}` as never)}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}
          >
            {sortLabels[sort]}
            <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10 min-w-35"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {(Object.entries(sortLabels) as [SortKey, string][]).map(([k, label]) => (
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
          title={t('emptyTitle')}
          subtitle={t('emptySubtitle')}
          ctaLabel={t('emptyCta')}
          ctaHref="/fiches/new"
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((fiche, i) => {
            const wc = wordCount(fiche.generated_content)
            return (
              <div
                key={fiche.id}
                className="relative group/card animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute top-3 right-3 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                  <DeleteEntityButton
                    table="fiches"
                    id={fiche.id}
                    entityLabel={t('entityLabel')}
                    variant="icon"
                    color={COLOR}
                    onDeleted={(id) => setFiches((prev) => prev.filter((f) => f.id !== id))}
                  />
                </div>
                <Link
                href={`/fiches/${fiche.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div className="flex flex-col flex-1 p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3 transition-[padding] duration-200 group-hover/card:pr-9">
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
                  <h3 className="text-base font-semibold mb-2 line-clamp-2 leading-snug transition-colors" style={{ color: 'var(--ink)' }}>
                    {fiche.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs line-clamp-2 leading-relaxed flex-1" style={{ color: 'var(--ink-500)' }}>
                    {excerpt(fiche.generated_content)}
                  </p>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-t"
                  style={{ borderColor: 'var(--ink-200)', background: 'var(--surface-2)' }}
                >
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
                  {format.dateTime(new Date(fiche.created_at), { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
                    {t('wordsCount', {count: wc})}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: COLOR }}>
                    {t('read')}
                  </span>
                </div>
              </Link>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && fiches.length > 0 && (
            <div className="col-span-full text-center py-16 text-sm" style={{ color: 'var(--ink-400)' }}>
              {t('noSearchResults')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
