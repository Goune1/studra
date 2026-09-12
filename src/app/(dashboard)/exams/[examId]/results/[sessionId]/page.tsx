import Link from 'next/link'
import { ArrowLeft, Check, ClipboardText, Sparkle, X } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { ExamAnswer, ExamQuestion, ExamQuestionMCQ } from '@/types'
import styles from '../../../../flashcards/flashcards.module.css'
import examStyles from '../../../exams.module.css'

const SUCCESS = '#1F4D3F'
const ERROR = '#B4503C'
const CIRCUMFERENCE = 2 * Math.PI * 40

function scoreColor(score: number) {
  return score >= 75 ? SUCCESS : score >= 50 ? '#A8762E' : ERROR
}

function DonutChart({ score }: { score: number }) {
  const color = scoreColor(score)
  const fill = CIRCUMFERENCE * (score / 100)

  return (
    <div className={examStyles.donut}>
      <svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="none" stroke="var(--ink-200)" strokeWidth="7" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${CIRCUMFERENCE}`}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <span className={examStyles.donutValue} style={{ color }}>{score}%</span>
    </div>
  )
}

export default async function ExamResultsPage({ params }: { params: Promise<{ examId: string; sessionId: string }> }) {
  const { examId, sessionId } = await params
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
  const correctCount = answers.filter((answer) => answer.is_correct).length
  const mcqQuestions = questions.filter((question) => question.type === 'mcq')
  const openQuestions = questions.filter((question) => question.type === 'open')

  return (
    <div className={styles.deckPage}>
      <Link href={`/exams/${examId}`} className={styles.backLink}><ArrowLeft size={14} /> Revenir à l’examen</Link>

      <section className={examStyles.resultsHero}>
        <div className={examStyles.scoreSummary}>
          <DonutChart score={score} />
          <div>
            <p className={examStyles.resultCount}>{correctCount}/{answers.length}</p>
            <p className={examStyles.resultLabel}>questions correctes</p>
            <h1 className={examStyles.resultTitle}>{exam.title}</h1>
            <p className={examStyles.resultSubject}>{exam.subject || 'Sans matière'}</p>
          </div>
        </div>
        <div className={examStyles.resultActions}>
          <Link href={`/exams/${examId}`} className={styles.secondaryButton}><ArrowLeft size={14} /> Refaire l’examen</Link>
          <Link href="/exams" className={styles.primaryButton}><ClipboardText size={15} /> Mes examens</Link>
        </div>
      </section>

      <section className={examStyles.resultsSection}>
        <header className={examStyles.resultsSectionHeader}>
          <h2>Correction détaillée</h2>
          <span>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
        </header>

        <div className={examStyles.resultsGrid}>
          {mcqQuestions.length > 0 && (
            <div className={examStyles.resultColumn}>
              <p className={examStyles.columnHeading}><span>QCM</span><span>{mcqQuestions.length} question{mcqQuestions.length > 1 ? 's' : ''}</span></p>
              <div className={examStyles.answerList}>
                {mcqQuestions.map((question, index) => {
                  const answer = answers.find((item) => item.question_id === question.id)
                  if (!answer) return null
                  const mcq = question as ExamQuestionMCQ
                  const chosen = mcq.options[Number.parseInt(answer.user_answer)]
                  const correct = mcq.options[mcq.correct_index]
                  const statusColor = answer.is_correct ? SUCCESS : ERROR

                  return (
                    <article key={question.id} className={examStyles.answerCard}>
                      <div className={examStyles.answerHeader}>
                        <span className={examStyles.statusIcon} style={{ background: `${statusColor}15`, color: statusColor }}>
                          {answer.is_correct ? <Check size={12} /> : <X size={12} />}
                        </span>
                        <span className={examStyles.questionNumber}>Q{index + 1}</span>
                        <span className={examStyles.answerType}>QCM</span>
                      </div>
                      <p className={examStyles.answerQuestion}>{question.question}</p>
                      <p className={examStyles.correctionLine} style={{ color: statusColor }}>Ta réponse : {chosen || 'Aucune réponse'}</p>
                      {!answer.is_correct && <p className={examStyles.correctionLine} style={{ color: SUCCESS }}>Bonne réponse : {correct}</p>}
                      {!answer.is_correct && mcq.explanation && <p className={examStyles.feedback}>{mcq.explanation}</p>}
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {openQuestions.length > 0 && (
            <div className={examStyles.resultColumn}>
              <p className={examStyles.columnHeading}><span>Questions ouvertes</span><span>{openQuestions.length} question{openQuestions.length > 1 ? 's' : ''}</span></p>
              <div className={examStyles.answerList}>
                {openQuestions.map((question, index) => {
                  const answer = answers.find((item) => item.question_id === question.id)
                  if (!answer) return null
                  const answerScore = Math.round(answer.score * 10)
                  const color = scoreColor(answerScore * 10)

                  return (
                    <article key={question.id} className={examStyles.answerCard}>
                      <div className={examStyles.answerHeader}>
                        <span className={examStyles.questionNumber}>Q{mcqQuestions.length + index + 1}</span>
                        <span className={examStyles.answerType}>Ouverte</span>
                        <span className={examStyles.answerScore} style={{ color }}>{answerScore}/10</span>
                      </div>
                      <p className={examStyles.answerQuestion}>{question.question}</p>
                      <p className={examStyles.answerText}>{answer.user_answer || 'Aucune réponse'}</p>
                      {answer.feedback && (
                        <p className={examStyles.feedback}>
                          <strong><Sparkle size={11} /> Retour IA</strong>
                          {answer.feedback}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
