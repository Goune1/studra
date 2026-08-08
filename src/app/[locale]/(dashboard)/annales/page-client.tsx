'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Scroll } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { EmptyState } from '@/components/content/EmptyState'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { GeneratedPastExam } from '@/types'

const COLOR = '#1F4D3F'

export default function AnnalesListPage() {
  const [exams, setExams] = useState<GeneratedPastExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('generated_past_exams')
        .select('*')
        .order('created_at', { ascending: false })
      setExams((data ?? []) as GeneratedPastExam[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">Annales</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="section-h">Mes annales</h1>
            <span
              className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}
            >
              {loading ? '…' : exams.length} sujet{exams.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Link href="/annales/new" className="btn btn-primary shrink-0">
          <PlusCircle size={15} />
          Nouvelle annale
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          Icon={Scroll}
          color={COLOR}
          title="Aucune annale générée"
          subtitle="Uploade une ancienne annale et choisis un cours pour générer un nouveau sujet dans le même style."
          ctaLabel="Générer ma première annale"
          ctaHref="/annales/new"
        />
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="relative group/card animate-fade-up">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                <DeleteEntityButton
                  table="generated_past_exams"
                  id={exam.id}
                  entityLabel="cette annale"
                  variant="icon"
                  color={COLOR}
                  onDeleted={(id) => setExams((prev) => prev.filter((e) => e.id !== id))}
                />
              </div>
              <Link
                href={`/annales/${exam.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-[transform,padding] duration-200 hover:-translate-y-0.5 group-hover/card:pr-12"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: COLOR + '15' }}
                >
                  <Scroll size={18} style={{ color: COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                    {exam.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {exam.questions_json.length} question{exam.questions_json.length > 1 ? 's' : ''} ·{' '}
                    {new Date(exam.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
