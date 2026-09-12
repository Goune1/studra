'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CaretRight, Timer } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { FreeRecallSession } from '@/types'
import styles from '../recall.module.css'

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function RecallSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<FreeRecallSession | null>(null)
  const [text, setText] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef(text)

  useEffect(() => { textRef.current = text }, [text])
  useEffect(() => {
    async function load() {
      const { data } = await createClient().from('free_recall_sessions').select('*').eq('id', sessionId).single()
      if (!data) { router.push('/recall/new'); return }
      if (data.evaluation) { router.push(`/recall/${sessionId}/results`); return }
      setSession(data as FreeRecallSession)
      setTimeLeft(data.duration_seconds)
    }
    load()
  }, [router, sessionId])

  const handleEnd = useCallback(async (finalText: string) => {
    if (submitting || ended) return
    setEnded(true)
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const res = await fetch(`/api/recall/sessions/${sessionId}/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userText: finalText }) })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de l’évaluation')
        setEnded(false)
        setSubmitting(false)
        return
      }
      router.push(`/recall/${sessionId}/results`)
    } catch {
      toast.error('Erreur de connexion')
      setEnded(false)
      setSubmitting(false)
    }
  }, [ended, router, sessionId, submitting])

  useEffect(() => {
    if (!started || timeLeft === null || ended) return
    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null || previous <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleEnd(textRef.current)
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ended, handleEnd, started, timeLeft])

  if (!session || timeLeft === null) return <div className={styles.loadingState}>Chargement de la session…</div>

  const warning = started && timeLeft <= 60
  const color = warning ? '#b91c1c' : 'var(--accent)'
  const progress = started ? (timeLeft / session.duration_seconds) * 100 : 100

  return (
    <div className={styles.sessionPage}>
      <header className={styles.sessionTop}>
        <div><p className={styles.sessionLabel}>{session.content_title}</p><p className={styles.sessionHint}>Rappel libre · écris tout ce que tu sais</p></div>
        <time className={styles.timer} style={{ color }} aria-live="polite" aria-label={`Temps restant : ${formatTime(timeLeft)}`}>{formatTime(timeLeft)}</time>
      </header>
      <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${progress}%`, backgroundColor: color }} /></div>
      <main className={styles.sessionBody}>
        {!started ? (
          <section className={styles.sessionCard}>
            <div><Timer size={25} weight="regular" color="var(--accent)" /><h1>Lancer le chronomètre ?</h1><p>Tu as {formatTime(session.duration_seconds)} pour écrire tout ce que tu sais sur « {session.content_title} ». Pas d’aide, pas de correction : avance à ton rythme.</p><button type="button" className={styles.primaryButton} onClick={() => { setStarted(true); setTimeout(() => textareaRef.current?.focus(), 50) }}><CaretRight size={16} weight="bold" /> Lancer le chronomètre</button></div>
          </section>
        ) : <textarea ref={textareaRef} className={styles.recallInput} value={text} onChange={(event) => setText(event.target.value)} disabled={ended} placeholder="Commence à écrire tout ce que tu sais…" spellCheck={false} autoCorrect="off" autoCapitalize="off" aria-label="Zone de rappel libre" />}
      </main>
      {started && !ended && <footer className={styles.sessionFooter}><p className={styles.wordCount}>{text.trim().split(/\s+/).filter(Boolean).length} mots</p><button type="button" className={styles.primaryButton} onClick={() => handleEnd(text)} disabled={submitting}>{submitting ? 'Évaluation…' : 'Terminer et évaluer'}</button></footer>}
      {ended && submitting && <footer className={styles.sessionFooter}><p className={styles.wordCount}>Évaluation en cours…</p></footer>}
    </div>
  )
}
