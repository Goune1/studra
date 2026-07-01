'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardCheck, PlusCircle, Search, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/content/EmptyState'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Exam, ExamSession, ExamQuestion } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#1F4D3F'
const MATIERES = ['Tous', 'SES', 'HGGSP', 'Maths', 'Histoire', 'Physique', 'Autre']
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = { date_desc: 'Date ↓', date_asc: 'Date ↑', alpha: 'Titre A→Z' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function scoreColor(s: number) {
  return s >= 75 ? '#1F4D3F' : s >= 50 ? '#A8762E' : '#B4503C'
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [sessions, setSessions] = useState<ExamSession[]>([])
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
      const [{ data: examsData }, { data: sessionsData }] = await Promise.all([
        supabase.from('exams').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('exam_sessions').select('exam_id, score').eq('user_id', user.id),
      ])
      setExams((examsData as Exam[]) ?? [])
      setSessions((sessionsData as ExamSession[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bestScores = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessions) {
      const prev = map.get(s.exam_id)
      if (prev === undefined || s.score > prev) map.set(s.exam_id, s.score)
    }
    return map
  }, [sessions])

  const filtered = useMemo(() => {
    let list = exams
    if (search) list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    if (matiere !== 'Tous') list = list.filter((e) => e.subject === matiere)
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [exams, search, matiere, sort])

  return (
    <div className="max-w-350">
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">Examens</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="section-h">Mes examens</h1>
            <span className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {loading ? '…' : exams.length} examen{exams.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Link href="/exams/new" className="btn btn-primary shrink-0">
          <PlusCircle size={15} />Nouvel examen
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un examen…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}>
          {MATIERES.map((m) => (
            <button key={m} onClick={() => setMatiere(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{ background: matiere === m ? 'var(--accent-soft)' : 'transparent', color: matiere === m ? COLOR : 'var(--ink-500)', border: matiere === m ? `1px solid ${COLOR}30` : '1px solid transparent' }}>
              {m}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}>
            {SORT_LABELS[sort]}<ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10 min-w-35"
              style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}>
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, label]) => (
                <button key={k} onClick={() => { setSort(k); setSortOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-black/[0.03] transition-colors"
                  style={{ color: sort === k ? COLOR : 'var(--ink-700)' }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && exams.length === 0 ? (
        <EmptyState Icon={ClipboardCheck} color={COLOR} title="Aucun examen"
          subtitle="Générez votre premier examen blanc depuis vos cours"
          ctaLabel="Créer un examen" ctaHref="/exams/new" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((exam, i) => {
            const questions = exam.questions as ExamQuestion[]
            const mcqCount = questions.filter((q) => q.type === 'mcq').length
            const openCount = questions.filter((q) => q.type === 'open').length
            const best = bestScores.get(exam.id)
            const sc = best !== undefined ? scoreColor(best) : null

            return (
              <div
                key={exam.id}
                className="relative group/card animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute top-3 right-3 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                  <DeleteEntityButton
                    table="exams"
                    id={exam.id}
                    entityLabel="cet examen"
                    variant="icon"
                    color={COLOR}
                    onDeleted={(id) => setExams((prev) => prev.filter((e) => e.id !== id))}
                  />
                </div>
              <Link href={`/exams/${exam.id}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '50'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${COLOR}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3 transition-[padding] duration-200 group-hover/card:pr-9">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '15' }}>
                      <ClipboardCheck size={15} style={{ color: COLOR }} />
                    </div>
                    {exam.subject && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: COLOR + '12', color: COLOR }}>{exam.subject}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold mb-3 line-clamp-2 leading-snug transition-colors" style={{ color: 'var(--ink)' }}>{exam.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--accent-soft)', color: COLOR }}>
                      {questions.length} questions
                    </span>
                    <span className="mono text-[10px] px-2 py-1 rounded-lg tabular-nums"
                      style={{ background: 'var(--surface-2)', color: 'var(--ink-500)' }}>
                      {mcqCount} QCM · {openCount} ouvertes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    {sc !== null ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                        <span className="mono text-xs font-semibold" style={{ color: sc }}>
                          Meilleur score : {best}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--ink-400)' }}>Jamais tenté</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--ink-200)', background: 'var(--surface-2)' }}>
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>{formatDate(exam.created_at)}</span>
                  <span className="text-[10px] font-semibold" style={{ color: COLOR }}>Voir →</span>
                </div>
              </Link>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && exams.length > 0 && (
            <div className="col-span-full text-center py-16 text-sm" style={{ color: 'var(--ink-400)' }}>Aucun examen ne correspond à votre recherche.</div>
          )}
        </div>
      )}
    </div>
  )
}
