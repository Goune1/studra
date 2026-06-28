'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { GeneratedPastExam, AnnaleQuestion, AnnaleAnswer } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#EF4444'

function QuestionCard({
  q,
  answer,
  showAnswer,
  onToggle,
  index,
}: {
  q: AnnaleQuestion
  answer: AnnaleAnswer | undefined
  showAnswer: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: COLOR + '15', color: COLOR }}
          >
            {index}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{
                  background:
                    q.type === 'mcq' ? '#6366f115' : q.type === 'open' ? '#10B98115' : '#F59E0B15',
                  color:
                    q.type === 'mcq' ? '#6366f1' : q.type === 'open' ? '#10B981' : '#F59E0B',
                }}
              >
                {q.type === 'mcq' ? 'QCM' : q.type === 'open' ? 'Question ouverte' : 'Cas pratique'}
              </span>
              {q.points && (
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {q.points} pt{q.points > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
              {q.question}
            </p>
            {q.type === 'mcq' && q.options && (
              <ul className="mt-3 space-y-1.5">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {answer && (
        <>
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors cursor-pointer"
            style={{
              borderTop: '1px solid var(--border)',
              color: showAnswer ? COLOR : 'var(--text-3)',
              background: showAnswer ? COLOR + '08' : 'transparent',
            }}
          >
            <span>Voir le corrigé</span>
            {showAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAnswer && (
            <div
              className="px-5 py-4 text-sm leading-relaxed"
              style={{ background: COLOR + '05', borderTop: `1px solid ${COLOR}20`, color: 'var(--text-2)' }}
            >
              <p>{answer.answer}</p>
              {answer.key_points && answer.key_points.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                    Points clés attendus
                  </p>
                  <ul className="space-y-1">
                    {answer.key_points.map((pt, i) => (
                      <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <span style={{ color: COLOR }}>•</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AnnalesExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [exam, setExam] = useState<GeneratedPastExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})
  const [showAllAnswers, setShowAllAnswers] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('generated_past_exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (!data) { router.push('/annales/new'); return }
      setExam(data as GeneratedPastExam)
      setLoading(false)
    }
    load()
  }, [examId, router])

  function toggleAnswer(id: string) {
    setShowAnswers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleAllAnswers() {
    const next = !showAllAnswers
    setShowAllAnswers(next)
    if (exam) {
      const all: Record<string, boolean> = {}
      exam.questions_json.forEach((q) => { all[q.id] = next })
      setShowAnswers(all)
    }
  }

  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm" style={{ color: 'var(--text-3)' }}>Chargement…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            {exam.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {exam.questions_json.length} question{exam.questions_json.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={toggleAllAnswers}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: showAllAnswers ? COLOR + '15' : 'var(--surface-2)',
              color: showAllAnswers ? COLOR : 'var(--text-2)',
              border: '1px solid var(--border)',
            }}
          >
            {showAllAnswers ? 'Masquer corrigés' : 'Voir corrigés'}
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
            title="Imprimer"
          >
            <Printer size={15} />
          </button>
          <DeleteEntityButton
            table="generated_past_exams"
            id={exam.id}
            entityLabel="cette annale"
            variant="button"
            color={COLOR}
            redirectTo="/annales"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions_json.map((q, i) => {
          const answer = exam.answers_json.find((a) => a.question_id === q.id)
          return (
            <QuestionCard
              key={q.id}
              q={q}
              answer={answer}
              showAnswer={!!showAnswers[q.id]}
              onToggle={() => toggleAnswer(q.id)}
              index={i + 1}
            />
          )
        })}
      </div>
    </div>
  )
}
