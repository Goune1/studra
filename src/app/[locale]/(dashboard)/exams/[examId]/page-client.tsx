'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter, Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ClipboardCheck, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Exam, ExamQuestion, ExamQuestionMCQ, ExamSession } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#1F4D3F'

function scoreColor(s: number) { return s >= 75 ? '#1F4D3F' : s >= 50 ? '#A8762E' : '#B4503C' }

export default function ExamPage() {
  const t = useTranslations('dashboard.exams')
  const format = useFormatter()
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
      if (!res.ok) { toast.error(json.error ?? t('toast.submitError')); setSubmitting(false); return }
      router.push(`/exams/${examId}/results/${json.sessionId}`)
    } catch {
      toast.error(t('toast.submitError'))
      setSubmitting(false)
    }
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-soft)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  // Submitting screen
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-soft)', borderTopColor: 'var(--accent)' }} />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            {t('detail.analyzingTitle')}
          </h2>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('detail.analyzing')}</p>
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
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-xs transition-colors mb-6" style={{ color: 'var(--ink-500)' }}>
          <ClipboardCheck size={12} />{t('detail.back')}
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] gap-8">
          {/* Left: exam info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {exam.subject && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
                  {exam.subject}
                </span>
              )}
            </div>
            <h1 className="section-h leading-tight mb-6">
              {exam.title}
            </h1>

            <div className="flex gap-3 mb-6">
              <span className="mono text-xs px-3 py-1.5 rounded-full font-medium tabular-nums"
                style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
                {t('questions', {count: questions.length})}
              </span>
              <span className="mono text-xs px-3 py-1.5 rounded-full font-medium tabular-nums"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-700)', border: '1px solid var(--ink-200)' }}>
                {t('openQuestions', {count: mcqCount, open: openCount})}
              </span>
            </div>

            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
              {t('detail.instructions')}
            </p>

            <button onClick={() => setStarted(true)} className="btn btn-primary w-full" style={{ padding: '16px 24px', fontSize: 16, borderRadius: 16 }}>
              {t('detail.start')} →
            </button>

            <div className="mt-4 flex justify-center">
              <DeleteEntityButton
                table="exams"
                id={exam.id}
                entityLabel={t('detail.entityLabel')}
                variant="button"
                redirectTo="/exams"
              />
            </div>
          </div>

          {/* Right: past sessions */}
          <div>
            <p className="mono text-[10px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--ink-400)' }}>
              {t('detail.attempts')}
            </p>

            {pastSessions.length === 0 ? (
              <div className="app-card p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('detail.noAttempts')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-400)' }}>{t('detail.startFirst')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((session, i) => {
                  const sc = scoreColor(session.score)
                  const correct = (session.answers as { is_correct: boolean }[]).filter((a) => a.is_correct).length
                  return (
                    <div key={session.id}
                      className="app-card p-4 animate-fade-up"
                      style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-3xl font-normal leading-none tracking-tight" style={{ color: sc }}>
                            {session.score}%
                          </span>
                          <p className="mono text-xs mt-1 tabular-nums" style={{ color: 'var(--ink-500)' }}>
                            {t('detail.correctAnswers', {correct, total: session.total_questions})}
                          </p>
                        </div>
                        <span className="mono text-[10px] tabular-nums text-right" style={{ color: 'var(--ink-400)' }}>
                          {format.dateTime(new Date(session.completed_at), {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                      <Link href={`/exams/${examId}/results/${session.id}`}
                        className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: COLOR }}>
                        {t('results.detailedCorrection')} →
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
        style={{ background: 'var(--app-bg)', borderColor: 'var(--ink-200)' }}>
        <button onClick={() => setStarted(false)}
          className="flex items-center gap-1.5 text-xs transition-colors shrink-0" style={{ color: 'var(--ink-500)' }}>
          <X size={14} />{t('detail.quit')}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
              {t('detail.question', {current: currentIndex + 1, total: questions.length})}
            </span>
            <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'var(--ink-200)' }}>
            <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: COLOR }} />
          </div>
        </div>

        <span className="text-[10px] px-2 py-1 rounded-full font-semibold shrink-0"
          style={{
            background: currentQ.type === 'mcq' ? '#3E6B7A15' : '#A8762E15',
            color: currentQ.type === 'mcq' ? '#3E6B7A' : '#A8762E',
            border: `1px solid ${currentQ.type === 'mcq' ? '#3E6B7A25' : '#A8762E25'}`,
          }}>
          {currentQ.type === 'mcq' ? 'QCM' : t('detail.openLabel')}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="text-2xl mb-8 leading-snug tracking-tight" style={{ color: 'var(--ink)' }}>
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
                      background: selected ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      borderColor: selected ? COLOR : 'var(--ink-200)',
                    }}>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{ borderColor: selected ? COLOR : 'var(--ink-200)', background: selected ? COLOR : 'transparent', color: selected ? 'var(--accent-fg)' : 'var(--ink-400)' }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--ink-700)' }}>{opt}</span>
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
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{ background: 'var(--bg-elev)', border: `1px solid var(--ink-200)`, color: 'var(--ink)' }}
                placeholder={t('detail.answerPlaceholder')}
                onFocus={(e) => (e.currentTarget.style.borderColor = COLOR)}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
              />
              <p className="mono text-right text-[10px] mt-1 tabular-nums" style={{ color: 'var(--ink-400)' }}>
                {(answers[currentQ.id] ?? '').length} car.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed border"
              style={{ color: 'var(--ink-500)', borderColor: 'var(--ink-200)' }}>
              <ChevronLeft size={14} />{t('detail.previous')}
            </button>

            {/* Dot indicators */}
            <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
              {questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrentIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === currentIndex ? '20px' : '8px',
                    height: '8px',
                    background: i === currentIndex ? COLOR : answers[q.id] ? COLOR + '60' : 'var(--ink-200)',
                  }} />
              ))}
            </div>

            {!isLast ? (
              <button onClick={() => setCurrentIndex((i) => i + 1)} disabled={!answers[currentQ.id]}
                className="btn btn-primary disabled:opacity-30 disabled:cursor-not-allowed">
                {t('detail.next')}<ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!allAnswered}
                className="btn btn-primary disabled:opacity-30 disabled:cursor-not-allowed">
                {t('detail.submit')} ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
