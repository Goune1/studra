'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, PaperPlaneTilt, Warning } from '@phosphor-icons/react'
import { trackTageMageDiagnosticCompleted, trackTageMageDiagnosticStarted } from '@/lib/analytics'
import { createSubmissionId, parseTageMageDiagnosticDraft, type TageMageDraftAnswer } from '@/lib/tage-mage/draft'
import { TAGE_MAGE_SECTIONS, TAGE_MAGE_SECTION_LABELS } from '@/lib/tage-mage/sections'
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
  const [hasDraft, setHasDraft] = useState(false)
  const [confirmingSubmit, setConfirmingSubmit] = useState(false)
  const question = questions[currentIndex]
  const estimatedMinutes = useMemo(() => Math.ceil(questions.reduce((total, item) => total + item.estimatedSeconds, 0) / 300) * 5, [questions])

  useEffect(() => {
    let raw: string | null = null
    let restoredSubmissionId = createSubmissionId()
    try { raw = localStorage.getItem(storageKey) } catch {}

    if (raw) {
      const draft = parseTageMageDiagnosticDraft(raw, questions.map((question) => question.id), contentVersion)
      if (draft) {
        restoredSubmissionId = draft.submissionId
        setCurrentIndex(draft.currentIndex)
        setAnswers(draft.answers)
        setTotalSeconds(draft.totalSeconds)
        setHasDraft(true)
      } else {
        try { localStorage.removeItem(storageKey) } catch {}
      }
    }
    setSubmissionId(restoredSubmissionId)
  }, [contentVersion, questions])

  function begin() {
    const now = Date.now()
    setStartedAt(now)
    setQuestionStartedAt(now)
    trackTageMageDiagnosticStarted()
  }

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
  const isAnswered = (questionId: string) => typeof answers[questionId]?.selectedIndex === 'number'
  const sectionNumber = TAGE_MAGE_SECTIONS.indexOf(question.section) + 1
  const sectionQuestions = questions.filter((item) => item.section === question.section)
  const questionInSection = sectionQuestions.findIndex((item) => item.id === question.id) + 1
  const isNewSection = currentIndex > 0 && questionInSection === 1
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
    setConfirmingSubmit(false)
    persistCurrentAnswer()
    setQuestionStartedAt(Date.now())
    setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), questions.length - 1))
  }

  function goTo(index: number) {
    if (index === currentIndex) return
    setConfirmingSubmit(false)
    persistCurrentAnswer()
    setQuestionStartedAt(Date.now())
    setCurrentIndex(index)
  }

  async function submit() {
    if (!submissionId) {
      setSubmitError('Le diagnostic est encore en cours d’initialisation. Réessaie.')
      return
    }
    const unansweredCount = questions.length - questions.filter((item) => isAnswered(item.id)).length
    if (unansweredCount > 0 && !confirmingSubmit) {
      setConfirmingSubmit(true)
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

  const unansweredCount = questions.length - questions.filter((item) => isAnswered(item.id)).length

  if (startedAt === null) {
    return (
      <main className={styles.runner}>
        <section className={styles.runnerCard} aria-labelledby="intro-title">
          <p className={styles.kicker}>Diagnostic privé Studra</p>
          <h1 id="intro-title" className={styles.question}>Repère où tu perds des points, sous-test par sous-test.</h1>
          <ul className={styles.introFacts}>
            <li><strong>{questions.length} questions</strong><span>{TAGE_MAGE_SECTIONS.length} sous-tests de {questions.length / TAGE_MAGE_SECTIONS.length} questions</span></li>
            <li><strong>Environ {estimatedMinutes} min</strong><span>Tu peux passer une question et revenir en arrière</span></li>
            <li><strong>À la fin</strong><span>Ta réussite par sous-test, tes priorités, une prochaine action et la correction détaillée</span></li>
          </ul>
          <ol className={styles.introSections}>
            {TAGE_MAGE_SECTIONS.map((section) => <li key={section}>{sectionLabel(section)}</li>)}
          </ol>
          <p className={styles.notice}>Ce n’est pas le TAGE MAGE officiel ni une simulation certifiée : aucun score sur 600, aucun classement, aucun pronostic d’admission. Le résultat est indicatif et sert à orienter ta préparation.</p>
          <div className={styles.formFooter}>
            <span className={styles.introVersion}>Version {contentVersion}</span>
            <button className={styles.primaryButton} type="button" onClick={begin} disabled={submissionId === null}>
              {hasDraft ? 'Reprendre le diagnostic' : 'Commencer le diagnostic'} <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.runner}>
      <div className={styles.runnerTopbar}>
        <div className={styles.runnerMeta}><span>Question {currentIndex + 1} sur {questions.length}</span><span><Clock size={14} /> {Math.floor(totalSeconds / 60)} min {totalSeconds % 60} s</span></div>
        <div className={styles.progressTrack} aria-label={`Progression : ${currentIndex + 1} sur ${questions.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}><div className={styles.progressBar} style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      </div>

      <section className={styles.runnerCard} aria-labelledby="question-title">
        <p className={styles.sectionPill}>{isNewSection && 'Nouveau · '}Sous-test {sectionNumber} sur {TAGE_MAGE_SECTIONS.length} · {sectionLabel(question.section)} · question {questionInSection} sur {sectionQuestions.length}</p>
        <h1 id="question-title" className={styles.question}>{question.prompt}</h1>
        <div className={styles.optionList} aria-label="Choisis une réponse">
          {question.options.map((option, index) => <button key={option} type="button" className={styles.option} data-selected={currentAnswer?.selectedIndex === index} aria-pressed={currentAnswer?.selectedIndex === index} onClick={() => selectAnswer(index)}>
            <span className={styles.optionMarker}>{letters[index]}</span><span>{option}</span>
          </button>)}
        </div>
      </section>

      <nav className={styles.runnerNavigation} aria-label="Navigation entre les questions">
        <button className={styles.navButton} type="button" onClick={() => move(-1)} disabled={currentIndex === 0 || submitting}><ArrowLeft size={15} /> Précédente</button>
        <div className={styles.questionDots} aria-label={`${answeredCount} réponses données sur ${questions.length}`}>
          {questions.map((item, index) => <button key={item.id} type="button" className={styles.dot} data-current={index === currentIndex} data-answered={isAnswered(item.id)} aria-label={`Aller à la question ${index + 1}${isAnswered(item.id) ? ', répondue' : ''}`} aria-current={index === currentIndex ? 'step' : undefined} onClick={() => goTo(index)} />)}
        </div>
        {currentIndex === questions.length - 1 ? <button className={styles.primaryButton} type="button" onClick={submit} disabled={submitting}>{submitting ? 'Envoi…' : confirmingSubmit ? 'Terminer quand même' : 'Terminer'} <PaperPlaneTilt size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={() => move(1)} disabled={submitting}>Suivante <ArrowRight size={15} /></button>}
      </nav>
      {confirmingSubmit && <p className={styles.submitWarning} role="alert"><Warning size={15} weight="fill" /> {unansweredCount} question{unansweredCount > 1 ? 's' : ''} sans réponse {unansweredCount > 1 ? 'seront comptées' : 'sera comptée'} fausse{unansweredCount > 1 ? 's' : ''}. Utilise les pastilles pour y revenir, ou termine quand même.</p>}
      {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
    </main>
  )
}
