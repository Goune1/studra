'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Scroll } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { GeneratedPastExam } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#EF4444'

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Annales</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
            Sujets générés dans le style de tes anciennes annales
          </p>
        </div>
        <Link
          href="/annales/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: '#EF4444', color: '#fff' }}
        >
          <Plus size={15} /> Nouvelle annale
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Scroll size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>
            Aucune annale générée
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
            Uploade une ancienne annale et choisis un cours pour générer un nouveau sujet.
          </p>
          <Link
            href="/annales/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#EF444420', color: '#EF4444' }}
          >
            <Plus size={14} /> Générer ma première annale
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="relative group/card">
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
                  style={{ background: '#EF444415' }}
                >
                  <Scroll size={18} style={{ color: '#EF4444' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                    {exam.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {exam.questions_json.length} questions ·{' '}
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
