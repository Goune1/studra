'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CaretLeft, CaretRight, Check, Play, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Exam, ExamQuestion, ExamQuestionMCQ, ExamSession } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { formatDate } from '@/lib/utils'
import styles from '../../flashcards/flashcards.module.css'
import examStyles from '../exams.module.css'

function scoreColor(score: number) {
  return score >= 75 ? '#1F4D3F' : score >= 50 ? '#A8762E' : '#B4503C'
}

export default function ExamPage({ exam, pastSessions }: { exam: Exam; pastSessions: ExamSession[] }) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers: answers }),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error ?? 'Erreur lors de la soumission')
        setSubmitting(false)
        return
      }
      router.push(`/exams/${exam.id}/results/${result.sessionId}`)
    } catch {
      toast.error('Erreur lors de la soumission')
      setSubmitting(false)
    }
  }

  if (submitting) {
    return (
      <div className={examStyles.loadingState}>
        <div>
          <div className={examStyles.spinner} />
          <strong>Correction en cours…</strong>
          <p>L’IA analyse tes réponses.</p>
        </div>
      </div>
    )
  }

  const questions = exam.questions as ExamQuestion[]
  const mcqCount = questions.filter((question) => question.type === 'mcq').length
  const openCount = questions.filter((question) => question.type === 'open').length

  if (!started) {
    return (
      <div className={styles.deckPage}>
        <Link href="/exams" className={styles.backLink}><ArrowLeft size={14} /> Mes examens</Link>

        <section className={styles.deckHeaderCard}>
          <div className={styles.deckHeaderMain}>
            <div className={styles.deckIdentity}>
              <p>{exam.subject || 'Sans matière'} · {formatDate(exam.created_at)}</p>
              <h1>{exam.title}</h1>
              <span>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
            </div>
            <div className={styles.deckActions}>
              <DeleteEntityButton
                table="exams"
                id={exam.id}
                entityLabel="cet examen"
                variant="button"
                color="#1F4D3F"
                redirectTo="/exams"
              />
              <button type="button" onClick={() => setStarted(true)} className={styles.primaryButton}>
                <Play size={15} weight="fill" /> Commencer
              </button>
            </div>
          </div>
          <div className={styles.deckHeaderNote}>
            <span>Correction automatique</span>
            <span>Les QCM sont corrigés directement et les réponses ouvertes sont évaluées par l’IA.</span>
          </div>
        </section>

        <div className={examStyles.overviewGrid}>
          <section className={examStyles.overviewPanel}>
            <p className={examStyles.panelLabel}>Format de l’examen</p>
            <p className={examStyles.examDescription}>Réponds à chaque question dans l’ordre ou navigue librement entre elles. Toutes les réponses sont requises avant la correction.</p>
            <div className={examStyles.formatRows}>
              <div className={examStyles.formatRow}><span>Total</span><strong>{questions.length}</strong></div>
              <div className={examStyles.formatRow}><span>QCM</span><strong>{mcqCount}</strong></div>
              <div className={examStyles.formatRow}><span>Ouvertes</span><strong>{openCount}</strong></div>
            </div>
          </section>

          <aside className={examStyles.sessionsPanel}>
            <p className={examStyles.panelLabel}>Tentatives précédentes</p>
            {pastSessions.length === 0 ? (
              <p className={examStyles.emptySessions}>Aucune tentative. Lance l’examen pour obtenir ton premier score.</p>
            ) : (
              <div className={examStyles.sessionList}>
                {pastSessions.map((session) => {
                  const correct = session.answers.filter((answer) => answer.is_correct).length
                  const color = scoreColor(session.score)
                  return (
                    <Link key={session.id} href={`/exams/${exam.id}/results/${session.id}`} className={examStyles.sessionCard}>
                      <span className={examStyles.sessionScore} style={{ color }}>{session.score}%</span>
                      <span className={examStyles.sessionMeta}>
                        <span>{correct}/{session.total_questions} correctes</span>
                        <time dateTime={session.completed_at}>{formatDate(session.completed_at)}</time>
                      </span>
                      <ArrowRight size={14} className={examStyles.sessionArrow} />
                    </Link>
                  )
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const allAnswered = questions.every((question) => answers[question.id] !== undefined && answers[question.id] !== '')
  const progress = (currentIndex + 1) / questions.length

  return (
    <div className={examStyles.sessionPage}>
      <header className={examStyles.sessionTopbar}>
        <div className={examStyles.sessionTopline}>
          <button type="button" onClick={() => setStarted(false)} className={examStyles.quitButton}><X size={14} /> Quitter</button>
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{currentQuestion.type === 'mcq' ? 'QCM' : 'Ouverte'}</span>
        </div>
        <div className={examStyles.progressTrack}>
          <div className={examStyles.progressBar} style={{ transform: `scaleX(${progress})` }} />
        </div>
      </header>

      <section className={examStyles.questionCard}>
        <span className={examStyles.questionType}>{currentQuestion.type === 'mcq' ? 'Choisis une réponse' : 'Rédige ta réponse'}</span>
        <h1 className={examStyles.questionText}>{currentQuestion.question}</h1>

        {currentQuestion.type === 'mcq' ? (
          <div className={examStyles.optionList}>
            {(currentQuestion as ExamQuestionMCQ).options.map((option, index) => {
              const selected = answers[currentQuestion.id] === String(index)
              return (
                <button
                  key={option}
                  type="button"
                  data-selected={selected}
                  className={examStyles.option}
                  onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: String(index) }))}
                >
                  <span className={examStyles.optionMarker}>{['A', 'B', 'C', 'D'][index]}</span>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <textarea
              value={answers[currentQuestion.id] ?? ''}
              onChange={(event) => setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))}
              className={examStyles.answerField}
              placeholder="Rédige ta réponse ici…"
            />
            <p className={examStyles.characterCount}>{(answers[currentQuestion.id] ?? '').length} caractères</p>
          </div>
        )}
      </section>

      <nav className={examStyles.navigation} aria-label="Navigation entre les questions">
        <button type="button" className={examStyles.navButton} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>
          <CaretLeft size={14} /> Précédente
        </button>
        <div className={examStyles.questionDots}>
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              aria-label={`Question ${index + 1}`}
              data-current={index === currentIndex}
              data-answered={Boolean(answers[question.id])}
              className={examStyles.dot}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
        {!isLast ? (
          <button type="button" className={examStyles.primaryNavButton} onClick={() => setCurrentIndex((index) => index + 1)} disabled={!answers[currentQuestion.id]}>
            Suivante <CaretRight size={14} />
          </button>
        ) : (
          <button type="button" className={examStyles.primaryNavButton} onClick={handleSubmit} disabled={!allAnswered}>
            Terminer <Check size={14} />
          </button>
        )}
      </nav>
    </div>
  )
}
