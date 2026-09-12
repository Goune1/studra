'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowCounterClockwise, Cards, CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { FreeRecallSession } from '@/types'
import styles from '../../recall.module.css'

function ResultSection({ title, Icon, children }: { title: string; Icon: typeof CheckCircle; children: React.ReactNode }) {
  return <section className={styles.resultSection}><div className={styles.resultHeading}><Icon size={17} weight="regular" /><h2>{title}</h2></div>{children}</section>
}

export default function RecallResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<FreeRecallSession | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await createClient().from('free_recall_sessions').select('*').eq('id', sessionId).single()
      if (!data || !data.evaluation) { router.push('/recall/new'); return }
      setSession(data as FreeRecallSession)
    }
    load()
  }, [router, sessionId])

  if (!session?.evaluation) return <div className={styles.loadingState}>Chargement des résultats…</div>
  const { evaluation } = session

  return (
    <div className={styles.resultsPage}>
      <header className={styles.resultsHeader}>
        <div><p className={styles.eyebrow}><CheckCircle size={14} weight="regular" /> Rappel libre</p><h1 className={styles.title}>Résultats.</h1><p className={styles.summary}>{session.content_title}</p></div>
        <div className={styles.score}><div><strong>{evaluation.score}</strong><span>sur 100</span></div></div>
      </header>
      {evaluation.notions_couvertes.length > 0 && <ResultSection title={`Notions couvertes · ${evaluation.notions_couvertes.length}`} Icon={CheckCircle}><ul className={styles.resultList}>{evaluation.notions_couvertes.map((notion) => <li key={notion}><CheckCircle size={15} weight="fill" />{notion}</li>)}</ul></ResultSection>}
      {evaluation.notions_oubliees.length > 0 && <ResultSection title={`Points à revoir · ${evaluation.notions_oubliees.length}`} Icon={XCircle}><ul className={styles.resultList}>{evaluation.notions_oubliees.map((notion) => <li key={notion}><XCircle size={15} weight="regular" />{notion}</li>)}</ul></ResultSection>}
      {evaluation.erreurs.length > 0 && <ResultSection title="Analyse détaillée" Icon={WarningCircle}><ul className={styles.resultList}>{evaluation.erreurs.map((error) => <li key={error}><WarningCircle size={15} weight="regular" />{error}</li>)}</ul></ResultSection>}
      {evaluation.flashcards_suggerees.length > 0 && <ResultSection title="Flashcards suggérées" Icon={Cards}><div className={styles.flashcardList}>{evaluation.flashcards_suggerees.map((card, index) => <article className={styles.flashcard} key={`${card.question}-${index}`}><p className={styles.flashcardLabel}>Question</p><p>{card.question}</p><p className={styles.flashcardLabel}>Réponse</p><p>{card.answer}</p></article>)}</div></ResultSection>}
      <div className={styles.resultActions}><Link href="/recall/new" className={styles.secondaryButton}><ArrowCounterClockwise size={16} weight="regular" /> Nouvelle session</Link><Link href="/flashcards" className={styles.primaryButton}><Cards size={16} weight="regular" /> Mes flashcards</Link></div>
    </div>
  )
}
