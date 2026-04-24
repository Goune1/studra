'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'
import { ClipboardCheck, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Exam, ExamQuestion, ExamQuestionMCQ, ExamQuestionOpen, ExamSession } from '@/types'

const COLOR = '#EF4444'

function scoreColor(s: number) { return s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444' }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ExamPage() {
  const params = useParams()
  const examId = params.examId as string
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: examData }, { data: sessions }] = await Promise.all([
        supabase.from('exams').select('*').eq('id', examId).single(),
        supabase.from('exam_sessions').select('*').eq('exam_id', examId).order('completed_at', { ascending: false }),
      ])
      if (examData) setExam(examData as Exam)
      if (sessions) setPastSessions(sessions as ExamSession[])
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers: answers }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur'); setSubmitting(false); return }
      router.push(`/exams/${examId}/results/${json.sessionId}`)
    } catch {
      toast.error('Erreur lors de la soumission')
      setSubmitting(false)
    }
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#EF4444]/20 border-t-[#EF4444] animate-spin" />
      </div>
    )
  }

  // Submitting screen
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#EF4444]/15 border-t-[#EF4444] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-1" style={{  }}>
            Correction en cours…
          </h2>
          <p className="text-sm text-[#64748B]">L&apos;IA analyse vos réponses</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLOR, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  const questions = exam.questions as ExamQuestion[]
  const mcqCount = questions.filter((q) => q.type === 'mcq').length
  const openCount = questions.filter((q) => q.type === 'open').length

  // ── LANDING SCREEN ──
  if (!started) {
    return (
      <div className="max-w-350">
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors mb-6">
          <ClipboardCheck size={12} />← Mes examens
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] gap-8">
          {/* Left: exam info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {exam.subject && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
                  {exam.subject}
                </span>
              )}
            </div>
            <h1 className="text-4xl text-white leading-tight mb-6 tracking-tight" style={{  }}>
              {exam.title}
            </h1>

            <div className="flex gap-3 mb-6">
              <span className="text-xs px-3 py-1.5 rounded-full font-medium tabular-nums"
                style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}>
                {questions.length} questions
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium tabular-nums"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)' }}>
                {mcqCount} QCM · {openCount} ouvertes
              </span>
            </div>

            <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
              Les QCM sont corrigés automatiquement. Les questions ouvertes sont évaluées par l&apos;IA selon votre réponse et les mots-clés attendus.
            </p>

            <button onClick={() => setStarted(true)}
              className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
              style={{ background: COLOR }}>
              Commencer l&apos;examen →
            </button>
          </div>

          {/* Right: past sessions */}
          <div>
            <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-4">
              Tentatives précédentes
            </p>

            {pastSessions.length === 0 ? (
              <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-sm text-[#64748B]">Aucune tentative</p>
                <p className="text-xs text-[#475569] mt-1">Lance ton premier examen !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((session, i) => {
                  const sc = scoreColor(session.score)
                  const correct = (session.answers as { is_correct: boolean }[]).filter((a) => a.is_correct).length
                  return (
                    <div key={session.id}
                      className="rounded-2xl border p-4 animate-fade-up"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-3xl font-normal leading-none tracking-tight" style={{ color: sc }}>
                            {session.score}%
                          </span>
                          <p className="text-xs text-[#64748B] mt-1 tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                            {correct}/{session.total_questions} correctes
                          </p>
                        </div>
                        <span className="text-[10px] text-[#475569] tabular-nums text-right" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                          {formatDateTime(session.completed_at)}
                        </span>
                      </div>
                      <Link href={`/exams/${examId}/results/${session.id}`}
                        className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: COLOR }}>
                        Voir la correction →
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── EXAM SESSION ──
  const currentQ = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const allAnswered = questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== '')
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 h-14 flex items-center px-4 md:px-8 gap-4 border-b"
        style={{ background: 'var(--app-bg)', borderColor: 'var(--border)' }}>
        <button onClick={() => setStarted(false)}
          className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors shrink-0">
          <X size={14} />Quitter
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: COLOR }} />
          </div>
        </div>

        <span className="text-[10px] px-2 py-1 rounded-full font-semibold shrink-0"
          style={{
            background: currentQ.type === 'mcq' ? '#3B82F615' : '#F59E0B15',
            color: currentQ.type === 'mcq' ? '#3B82F6' : '#F59E0B',
            border: `1px solid ${currentQ.type === 'mcq' ? '#3B82F625' : '#F59E0B25'}`,
          }}>
          {currentQ.type === 'mcq' ? 'QCM' : 'Ouverte'}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="text-2xl text-white mb-8 leading-snug tracking-tight" style={{  }}>
            {currentQ.question}
          </p>

          {currentQ.type === 'mcq' && (
            <div className="space-y-3 mb-8">
              {(currentQ as ExamQuestionMCQ).options.map((opt, i) => {
                const selected = answers[currentQ.id] === String(i)
                return (
                  <button key={i} onClick={() => setAnswers((a) => ({ ...a, [currentQ.id]: String(i) }))}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-150"
                    style={{
                      background: selected ? COLOR + '12' : 'var(--surface)',
                      borderColor: selected ? COLOR : 'var(--border)',
                    }}>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{ borderColor: selected ? COLOR : 'var(--border-2)', background: selected ? COLOR : 'transparent', color: selected ? 'var(--text-1)' : 'var(--text-4)' }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </div>
                    <span className="text-sm text-[#CBD5E1]">{opt}</span>
                  </button>
                )
              })}
            </div>
          )}

          {currentQ.type === 'open' && (
            <div className="mb-8">
              <textarea
                value={answers[currentQ.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [currentQ.id]: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#475569] outline-none resize-none transition-colors"
                style={{ background: 'var(--surface-2)', border: `1px solid var(--border)` }}
                placeholder="Rédigez votre réponse ici…"
                onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '60')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <p className="text-right text-[10px] text-[#475569] mt-1 tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {(answers[currentQ.id] ?? '').length} car.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-[#64748B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-[#1E1E2E] hover:border-[#2E2E45]">
              <ChevronLeft size={14} />Préc.
            </button>

            {/* Dot indicators */}
            <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
              {questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrentIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === currentIndex ? '20px' : '8px',
                    height: '8px',
                    background: i === currentIndex ? COLOR : answers[q.id] ? COLOR + '60' : 'var(--border-2)',
                  }} />
              ))}
            </div>

            {!isLast ? (
              <button onClick={() => setCurrentIndex((i) => i + 1)} disabled={!answers[currentQ.id]}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ background: COLOR }}>
                Suiv.<ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!allAnswered}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ background: '#22C55E' }}>
                Soumettre ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
