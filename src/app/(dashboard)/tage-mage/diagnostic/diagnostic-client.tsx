'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, PaperPlaneTilt } from '@phosphor-icons/react'
import { trackTageMageDiagnosticCompleted, trackTageMageDiagnosticStarted } from '@/lib/analytics'
import { parseTageMageDiagnosticDraft, type TageMageDraftAnswer } from '@/lib/tage-mage/draft'
import { TAGE_MAGE_SECTION_LABELS } from '@/lib/tage-mage/sections'
import type { TageMageSection } from '@/lib/tage-mage/types'
import styles from '../tage-mage.module.css'

type PublicQuestion = {
  id: string
  section: TageMageSection
  prompt: string
  options: readonly string[]
  estimatedSeconds: number
  contentVersion: number
}
type Answer = TageMageDraftAnswer

const storageKey = 'studra:tage-mage:diagnostic-draft'
const letters = ['A', 'B', 'C', 'D', 'E']

function sectionLabel(section: TageMageSection) { return TAGE_MAGE_SECTION_LABELS[section] }

export function DiagnosticClient({ questions }: { questions: PublicQuestion[] }) {
  const router = useRouter()
  const contentVersion = useMemo(() => Math.max(...questions.map((question) => question.contentVersion)), [questions])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const question = questions[currentIndex]

  useEffect(() => {
    let raw: string | null = null
    let restoredSubmissionId = crypto.randomUUID()
    try { raw = localStorage.getItem(storageKey) } catch {}

    if (raw) {
      const draft = parseTageMageDiagnosticDraft(raw, questions.map((question) => question.id), contentVersion)
      if (draft) {
        restoredSubmissionId = draft.submissionId
        setCurrentIndex(draft.currentIndex)
        setAnswers(draft.answers)
        setTotalSeconds(draft.totalSeconds)
      } else {
        try { localStorage.removeItem(storageKey) } catch {}
      }
    }
    setSubmissionId(restoredSubmissionId)
    const now = Date.now()
    setStartedAt(now)
    setQuestionStartedAt(now)
    trackTageMageDiagnosticStarted()
  }, [contentVersion, questions])

  useEffect(() => {
    if (startedAt === null || submitting) return
    const interval = window.setInterval(() => setTotalSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(interval)
  }, [startedAt, submitting])

  useEffect(() => {
    if (startedAt === null || questionStartedAt === null || submissionId === null) return
    const activeDuration = (answers[question.id]?.durationSeconds ?? 0) + Math.floor((Date.now() - questionStartedAt) / 1000)
    const draft = {
      contentVersion,
      submissionId,
      currentIndex,
      answers: { ...answers, [question.id]: { selectedIndex: answers[question.id]?.selectedIndex ?? null, durationSeconds: activeDuration } },
      totalSeconds,
    }
    try { localStorage.setItem(storageKey, JSON.stringify(draft)) } catch {}
  }, [answers, contentVersion, currentIndex, question, questionStartedAt, startedAt, submissionId, totalSeconds])

  const currentAnswer = answers[question.id]
  const answeredCount = Object.values(answers).filter((answer) => answer.selectedIndex !== null).length
  const elapsedForQuestion = (questionStartedAt === null ? 0 : Math.floor((Date.now() - questionStartedAt) / 1000))

  function persistCurrentAnswer() {
    const durationSeconds = (answers[question.id]?.durationSeconds ?? 0) + elapsedForQuestion
    setAnswers((current) => ({
      ...current,
      [question.id]: { selectedIndex: current[question.id]?.selectedIndex ?? null, durationSeconds },
    }))
  }

  function selectAnswer(selectedIndex: number) {
    setAnswers((current) => ({
      ...current,
      [question.id]: { selectedIndex, durationSeconds: current[question.id]?.durationSeconds ?? 0 },
    }))
  }

  function move(direction: -1 | 1) {
    persistCurrentAnswer()
    setQuestionStartedAt(Date.now())
    setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), questions.length - 1))
  }

  function goTo(index: number) {
    if (index === currentIndex) return
    persistCurrentAnswer()
    setQuestionStartedAt(Date.now())
    setCurrentIndex(index)
  }

  async function submit() {
    if (!submissionId) {
      setSubmitError('Le diagnostic est encore en cours d’initialisation. Réessaie.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const finalAnswers = {
      ...answers,
      [question.id]: {
        selectedIndex: answers[question.id]?.selectedIndex ?? null,
        durationSeconds: (answers[question.id]?.durationSeconds ?? 0) + elapsedForQuestion,
      },
    }
    const payload = {
      submissionId,
      answers: questions.map((item) => ({
        questionId: item.id,
        selectedIndex: finalAnswers[item.id]?.selectedIndex ?? null,
        durationSeconds: finalAnswers[item.id]?.durationSeconds ?? 0,
      })),
    }

    try {
      const response = await fetch('/api/tage-mage/diagnostic/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const body = await response.json() as { attemptId?: string; error?: string }
      if (!response.ok || !body.attemptId) throw new Error(body.error ?? 'La soumission a échoué.')
      try { localStorage.removeItem(storageKey) } catch {}
      trackTageMageDiagnosticCompleted(totalSeconds, answeredCount)
      router.push(`/tage-mage/results/${body.attemptId}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'La soumission a échoué. Réessaie.')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.runner}>
      <div className={styles.runnerTopbar}>
        <div className={styles.runnerMeta}><span>Question {currentIndex + 1} sur {questions.length}</span><span><Clock size={14} /> {Math.floor(totalSeconds / 60)} min {totalSeconds % 60} s</span></div>
        <div className={styles.progressTrack} aria-label={`Progression : ${currentIndex + 1} sur ${questions.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}><div className={styles.progressBar} style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      </div>

      <section className={styles.runnerCard} aria-labelledby="question-title">
        <p className={styles.sectionPill}>{sectionLabel(question.section)}</p>
        <h1 id="question-title" className={styles.question}>{question.prompt}</h1>
        <div className={styles.optionList} role="radiogroup" aria-label="Choisis une réponse">
          {question.options.map((option, index) => <button key={option} type="button" className={styles.option} data-selected={currentAnswer?.selectedIndex === index} role="radio" aria-checked={currentAnswer?.selectedIndex === index} onClick={() => selectAnswer(index)}>
            <span className={styles.optionMarker}>{letters[index]}</span><span>{option}</span>
          </button>)}
        </div>
      </section>

      <nav className={styles.runnerNavigation} aria-label="Navigation entre les questions">
        <button className={styles.navButton} type="button" onClick={() => move(-1)} disabled={currentIndex === 0 || submitting}><ArrowLeft size={15} /> Précédente</button>
        <div className={styles.questionDots} aria-label={`${answeredCount} réponses données sur ${questions.length}`}>
          {questions.map((item, index) => <button key={item.id} type="button" className={styles.dot} data-current={index === currentIndex} data-answered={answers[item.id]?.selectedIndex !== null} aria-label={`Aller à la question ${index + 1}${answers[item.id]?.selectedIndex !== null ? ', répondue' : ''}`} aria-current={index === currentIndex ? 'step' : undefined} onClick={() => goTo(index)} />)}
        </div>
        {currentIndex === questions.length - 1 ? <button className={styles.primaryButton} type="button" onClick={submit} disabled={submitting}>{submitting ? 'Envoi…' : 'Terminer'} <PaperPlaneTilt size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={() => move(1)} disabled={submitting}>Suivante <ArrowRight size={15} /></button>}
      </nav>
      {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
    </main>
  )
}
