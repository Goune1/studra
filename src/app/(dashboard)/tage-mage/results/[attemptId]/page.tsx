import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTageMageNextStep, rankTageMageSections } from '@/lib/tage-mage/insights'
import { TAGE_MAGE_SECTION_LABELS } from '@/lib/tage-mage/sections'
import type { TageMageSection } from '@/lib/tage-mage/types'
import styles from '../../tage-mage.module.css'
import { ResultsTracker } from './results-tracker'

type StoredAnswer = { questionId: string; selectedIndex: number | null; durationSeconds: number }
type SectionResult = { section: string; correctCount: number; totalQuestions: number; averageDurationSeconds: number }
type StoredSectionResult = Omit<SectionResult, 'section'>
type Question = { id: string; section: TageMageSection; prompt: string; options: readonly string[]; correctIndex: number; explanation: string; method: string }
type Attempt = { content_version: number; question_snapshot: Question[]; correct_count: number; total_questions: number; duration_seconds: number; answers: StoredAnswer[]; section_results: Record<string, StoredSectionResult> }

function sectionLabel(section: string) {
  return TAGE_MAGE_SECTION_LABELS[section as TageMageSection] ?? section.replaceAll('_', ' ')
}
function duration(seconds: number) { return `${Math.floor(seconds / 60)} min ${seconds % 60} s` }

export default async function TageMageResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data } = await supabase
    .from('tage_mage_diagnostic_attempts')
    .select('content_version, question_snapshot, correct_count, total_questions, duration_seconds, answers, section_results')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data) notFound()

  const attempt = data as Attempt
  const questions = attempt.question_snapshot
  if (!Array.isArray(questions) || questions.length !== attempt.total_questions) notFound()
  const sectionResults = Object.entries(attempt.section_results).map(([section, result]) => ({ section, ...result }))
  const answers = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
  const { strengths, priorities } = rankTageMageSections(sectionResults)
  const firstPriority = priorities[0]
  const nextStep = firstPriority ? getTageMageNextStep(firstPriority.section) : null
  const firstQuestionOfSection = new Set(questions.filter((question, index) => questions.findIndex((item) => item.section === question.section) === index).map((question) => question.id))

  return (
    <main className={styles.resultPage}>
      <ResultsTracker />
      <Link href="/tage-mage" className={styles.backLink}><ArrowLeft size={15} /> Retour au module</Link>
      <section className={styles.resultHero}>
        <div><p className={styles.kicker}>Diagnostic terminé</p><h1>Ton repère de préparation.</h1><p className={styles.resultCount}>{attempt.correct_count}/{attempt.total_questions}</p><p className={styles.resultLabel}>réponses correctes · {duration(attempt.duration_seconds)} · version {attempt.content_version}</p></div>
        <p className={styles.notice}>Résultat indicatif d’un diagnostic privé Studra de {attempt.total_questions} questions. Ce n’est ni un score TAGE MAGE officiel, ni une estimation sur 600, ni un pronostic d’admission.</p>
      </section>

      <section className={styles.resultSection} aria-labelledby="section-results"><h2 id="section-results">Par sous-test</h2><div className={styles.sectionResults}>{sectionResults.map((result) => <article key={result.section} className={styles.sectionMetric}><strong>{result.correctCount}/{result.totalQuestions}</strong><span>{sectionLabel(result.section)}<br />{duration(Math.round(result.averageDurationSeconds))} en moyenne</span></article>)}</div></section>

      <section className={styles.resultSection} aria-labelledby="priorities"><h2 id="priorities">Pour la suite</h2>
        <div className={styles.nextStep}>
          <p className={styles.kicker}>Ta prochaine action</p>
          {firstPriority && nextStep ? <>
            <h3>{sectionLabel(firstPriority.section)}</h3>
            <p>{nextStep}</p>
            <a href={`#correction-${firstPriority.section}`}>Revoir d’abord les questions de ce sous-test <ArrowRight size={13} /></a>
          </> : <>
            <h3>Aucune priorité nette.</h3>
            <p>Tu as réussi chaque sous-test. Refais le diagnostic en visant un temps plus court, puis relis les méthodes des questions où tu as hésité.</p>
          </>}
        </div>
        <div className={styles.priorityGrid}><div><h3>Points d’appui</h3><ul className={styles.priorityList}>{strengths.length ? strengths.map((result) => <li key={result.section}>{sectionLabel(result.section)} · {result.correctCount}/{result.totalQuestions}</li>) : <li>Pas encore de point d’appui net : aucun sous-test n’atteint 3 bonnes réponses sur 4.</li>}</ul></div><div><h3>Priorités</h3><ul className={styles.priorityList}>{priorities.length ? priorities.map((result) => <li key={result.section}>{sectionLabel(result.section)} · {result.correctCount}/{result.totalQuestions}</li>) : <li>Aucune : chaque sous-test est réussi.</li>}</ul></div></div></section>

      <section className={styles.resultSection} aria-labelledby="corrections"><h2 id="corrections">Correction détaillée</h2><div className={styles.correctionList}>{questions.map((question, index) => {
        const answer = answers.get(question.id)
        const correct = answer?.selectedIndex === question.correctIndex
        const chosen = answer?.selectedIndex === null || answer?.selectedIndex === undefined ? 'Aucune réponse' : question.options[answer.selectedIndex]
        return <article key={question.id} id={firstQuestionOfSection.has(question.id) ? `correction-${question.section}` : undefined} className={styles.correctionCard}><div className={styles.correctionMeta}>{correct ? <CheckCircle className={styles.correct} size={17} weight="fill" /> : <XCircle className={styles.incorrect} size={17} weight="fill" />}<span>Question {index + 1} · {sectionLabel(question.section)}</span></div><h3>{question.prompt}</h3><p className={styles.answerLine}>Ta réponse : {chosen}</p>{!correct && <p className={styles.answerLine}><strong>Bonne réponse : </strong>{question.options[question.correctIndex]}</p>}<p className={styles.explanation}><strong>Explication. </strong>{question.explanation}</p><p className={styles.method}><strong>Méthode. </strong>{question.method}</p></article>
      })}</div><div className={styles.formFooter}><Link href="/tage-mage" className={styles.secondaryButton}>Retour au module</Link><Link href="/tage-mage/diagnostic" className={styles.primaryButton}>Refaire le diagnostic <ArrowRight size={15} /></Link></div></section>
    </main>
  )
}
