import type {Locale} from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { Sparkles, Check, X, ClipboardCheck } from 'lucide-react'
import type { ExamAnswer, ExamQuestion, ExamQuestionMCQ } from '@/types'
import { setRequestLocale } from 'next-intl/server'

function scoreColor(s: number) { return s >= 75 ? '#1F4D3F' : s >= 50 ? '#A8762E' : '#B4503C' }
const OK = '#1F4D3F'
const KO = '#B4503C'

const CIRC = 2 * Math.PI * 40

function DonutChart({ score }: { score: number }) {
  const color = scoreColor(score)
  const fill = CIRC * (score / 100)
  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={40} fill="none" stroke="var(--ink-200)" strokeWidth={8} />
        <circle cx={48} cy={48} r={40} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={`${fill} ${CIRC}`}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-normal tracking-tight" style={{ color }}>
          {score}%
        </span>
      </div>
    </div>
  )
}

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string; sessionId: string; locale: string }>
}) {
  const { examId, sessionId, locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations({locale: locale as Locale, namespace: 'dashboard.exams'})
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: session }, { data: exam }] = await Promise.all([
    supabase.from('exam_sessions').select('*').eq('id', sessionId).eq('user_id', user!.id).single(),
    supabase.from('exams').select('*').eq('id', examId).single(),
  ])

  if (!session || !exam) notFound()
  if (exam.user_id !== user!.id && !exam.is_public) notFound()

  const answers = session.answers as ExamAnswer[]
  const questions = exam.questions as ExamQuestion[]
  const score = session.score as number
  const correctCount = answers.filter((a) => a.is_correct).length
  const sc = scoreColor(score)

  const mcqQs = questions.filter((q) => q.type === 'mcq')
  const openQs = questions.filter((q) => q.type === 'open')

  return (
    <div className="max-w-350">
      {/* Score hero */}
      <div className="rounded-2xl border p-6 md:p-8 mb-8 animate-fade-up"
        style={{ background: 'var(--bg-elev)', borderColor: 'var(--ink-200)' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-6">
            <DonutChart score={score} />
            <div>
              <h1 className="text-5xl font-normal leading-none mb-2 tracking-tight" style={{ color: sc }}>
                {correctCount}/{answers.length}
              </h1>
              <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('results.correct')}</p>
              <h2 className="text-lg mt-2 line-clamp-1" style={{ color: 'var(--ink)' }}>
                {exam.title}
              </h2>
              {exam.subject && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mt-2 inline-block"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(31,77,63,0.2)' }}>
                  {exam.subject}
                </span>
              )}
            </div>
          </div>

          <div className="md:ml-auto flex gap-3 flex-wrap">
            <Link href={`/exams/${examId}`} className="btn btn-outline">
              {t('results.back')}
            </Link>
            <Link href="/exams" className="btn btn-primary">
              <ClipboardCheck size={14} />{t('results.mine')}
            </Link>
          </div>
        </div>
      </div>

      {/* Correction détaillée */}
      <p className="mono text-[10px] font-medium uppercase tracking-widest mb-5" style={{ color: 'var(--ink-400)' }}>{t('results.detailedCorrection')}</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* QCM column */}
        {mcqQs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="mono text-[9px] font-medium uppercase tracking-widest" style={{ color: '#3E6B7A' }}>{t('results.mcq')}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--ink-200)' }} />
              <span className="mono text-[9px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
                {t('questions', {count: mcqQs.length})}
              </span>
            </div>
            {mcqQs.map((q, i) => {
              const ans = answers.find((a) => a.question_id === q.id)
              if (!ans) return null
              const mcq = q as ExamQuestionMCQ
              const chosen = mcq.options[parseInt(ans.user_answer)]
              const correct = mcq.options[mcq.correct_index]

              return (
                <div key={q.id} className="rounded-xl border p-4 animate-fade-up"
                  style={{ background: 'var(--bg-elev)', borderColor: ans.is_correct ? `${OK}30` : `${KO}30`, animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: ans.is_correct ? `${OK}15` : `${KO}15` }}>
                      {ans.is_correct
                        ? <Check size={12} style={{ color: OK }} />
                        : <X size={12} style={{ color: KO }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="mono text-[9px] tabular-nums" style={{ color: 'var(--ink-400)' }}>Q{i + 1}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#3E6B7A15', color: '#3E6B7A' }}>{t('results.mcq')}</span>
                      </div>
                      <p className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>{q.question}</p>
                      <div className="space-y-1.5 text-xs">
                        <p style={{ color: ans.is_correct ? OK : KO }}>
                          {ans.is_correct ? '✓' : '✗'} {t('results.yourAnswer')} <span className={ans.is_correct ? '' : 'line-through opacity-70'}>{chosen}</span>
                        </p>
                        {!ans.is_correct && (
                          <p style={{ color: OK }}>✓ {t('results.correctAnswer')} {correct}</p>
                        )}
                        {!ans.is_correct && mcq.explanation && (
                          <p className="italic mt-2 pt-2 border-t" style={{ color: 'var(--ink-500)', borderColor: 'var(--ink-200)' }}>{mcq.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Open questions column */}
        {openQs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="mono text-[9px] font-medium uppercase tracking-widest" style={{ color: '#A8762E' }}>{t('results.open')}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--ink-200)' }} />
              <span className="mono text-[9px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
                {t('questions', {count: openQs.length})}
              </span>
            </div>
            {openQs.map((q, i) => {
              const ans = answers.find((a) => a.question_id === q.id)
              if (!ans) return null
              const aiScore = Math.round(ans.score * 10)

              return (
                <div key={q.id} className="rounded-xl border p-4 animate-fade-up"
                  style={{ background: 'var(--bg-elev)', borderColor: 'var(--ink-200)', animationDelay: `${(mcqQs.length + i) * 40}ms` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="mono text-[9px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
                      Q{mcqQs.length + i + 1}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#A8762E15', color: '#A8762E' }}>{t('results.openSingular')}</span>
                    <span className="mono text-[9px] px-2 py-0.5 rounded-full font-semibold ml-auto"
                      style={{ background: scoreColor(aiScore * 10) + '15', color: scoreColor(aiScore * 10) }}>
                      {aiScore}/10
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>{q.question}</p>
                  {ans.user_answer ? (
                    <div className="mb-3 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
                      style={{ background: 'var(--surface-2)', color: 'var(--ink-700)' }}>
                      {ans.user_answer}
                    </div>
                  ) : (
                    <p className="text-xs italic mb-3" style={{ color: 'var(--ink-400)' }}>{t('results.noAnswer')}</p>
                  )}
                  {ans.feedback && (
                    <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
                      style={{ background: 'var(--accent-soft)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>{t('results.aiFeedback')}</span>
                      </div>
                      <p style={{ color: 'var(--ink-700)' }}>{ans.feedback}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
