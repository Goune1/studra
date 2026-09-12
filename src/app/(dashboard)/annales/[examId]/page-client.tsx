'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CaretDown, CaretUp, Printer, ArrowLeft } from '@phosphor-icons/react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { AnnaleAnswer, AnnaleQuestion, GeneratedPastExam } from '@/types'
import styles from '../annales.module.css'

function Question({ q, answer, index, open, onToggle }: { q: AnnaleQuestion; answer?: AnnaleAnswer; index: number; open: boolean; onToggle: () => void }) {
  const labels: Record<string, string> = { mcq: 'QCM', open: 'Réponse ouverte' }
  return <article className={styles.question}><div className={styles.questionBody}><span className={styles.number}>{index}</span><div><div className={styles.badges}><span className={styles.badge}>{labels[q.type] ?? 'Cas pratique'}</span>{q.points && <span className={styles.points}>{q.points} {q.points > 1 ? 'points' : 'point'}</span>}</div><p className={styles.questionText}>{q.question}</p>{q.type === 'mcq' && q.options && <ul className={styles.options}>{q.options.map((option, optionIndex) => <li key={optionIndex}>{option}</li>)}</ul>}</div></div>{answer && <><button type="button" onClick={onToggle} className={styles.answerButton} data-open={open}><span>{open ? 'Masquer le corrigé' : 'Voir le corrigé'}</span>{open ? <CaretUp size={15} weight="regular" /> : <CaretDown size={15} weight="regular" />}</button>{open && <div className={styles.answer}><p>{answer.answer}</p>{answer.key_points?.length ? <div className={styles.keyPoints}><h3>Points clés attendus</h3><ul>{answer.key_points.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}</ul></div> : null}</div>}</>}</article>
}

export default function AnnalesExamPage() {
  const params = useParams(); const router = useRouter(); const examId = params.examId as string
  const [exam, setExam] = useState<GeneratedPastExam | null>(null); const [loading, setLoading] = useState(true); const [answers, setAnswers] = useState<Record<string, boolean>>({}); const [allOpen, setAllOpen] = useState(false)
  useEffect(() => { async function load() { const { data } = await createClient().from('generated_past_exams').select('*').eq('id', examId).single(); if (!data) { router.push('/annales/new'); return }; setExam(data as GeneratedPastExam); setLoading(false) }; void load() }, [examId, router])
  if (loading || !exam) return <main className={styles.detailPage}><div className={styles.skeleton} /></main>
  const questions = exam.questions_json
  function toggleAll() { const next = !allOpen; setAllOpen(next); setAnswers(Object.fromEntries(questions.map(question => [question.id, next]))) }
  return <main className={styles.detailPage}><Link href="/annales" className={styles.context}><ArrowLeft size={14} weight="regular" /> Annales</Link><header className={styles.detailTop}><div><p className={styles.context}>Épreuve générée</p><h1 className={styles.title}>{exam.title}</h1><p className={styles.summary}>{exam.questions_json.length} {exam.questions_json.length > 1 ? 'questions' : 'question'} · Corrigé inclus</p></div><div className={styles.actions}><button onClick={toggleAll} className={styles.secondary}>{allOpen ? 'Masquer les corrigés' : 'Voir les corrigés'}</button><button onClick={() => window.print()} className={styles.secondary} aria-label="Imprimer"><Printer size={16} weight="regular" /></button><DeleteEntityButton table="generated_past_exams" id={exam.id} entityLabel="cette annale" variant="button" color="#1F4D3F" redirectTo="/annales" /></div></header><section className={styles.questions}>{exam.questions_json.map((question, index) => <Question key={question.id} q={question} answer={exam.answers_json.find(answer => answer.question_id === question.id)} index={index + 1} open={Boolean(answers[question.id])} onToggle={() => setAnswers(current => ({ ...current, [question.id]: !current[question.id] }))} />)}</section></main>
}
