'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, CheckCircle, Lightbulb, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { ProGate } from '@/components/pro-gate'
import type { FeynmanDiagnosis, FeynmanSession, Profile, SocrateMessage } from '@/types'
import styles from '../socrate.module.css'

export default function SocrateSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [session, setSession] = useState<FeynmanSession | null>(null)
  const [messages, setMessages] = useState<SocrateMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosis, setDiagnosis] = useState<FeynmanDiagnosis | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data as Profile)
        setProfileLoading(false)
      })
    })
  }, [])

  useEffect(() => {
    if (!profile || profile.plan !== 'pro') return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('feynman_sessions').select('*').eq('id', sessionId).single()
      if (!data) { router.push('/socrate/new'); return }
      setSession(data as FeynmanSession)
      setMessages(data.messages as SocrateMessage[])
      if (data.diagnosis) setDiagnosis(data.diagnosis as FeynmanDiagnosis)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    load()
  }, [sessionId, router, profile])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, diagnosis])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setMessages((current) => [...current, { role: 'user', content: userText }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`/api/socrate/sessions/${sessionId}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userMessage: userText }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Une erreur est survenue'); return }
      setMessages((current) => [...current, { role: 'assistant', content: json.message }])
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function handleDiagnose() {
    setDiagnosing(true)
    try {
      const res = await fetch(`/api/socrate/sessions/${sessionId}/diagnose`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Une erreur est survenue'); return }
      setDiagnosis(json.diagnosis as FeynmanDiagnosis)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setDiagnosing(false)
    }
  }

  if (profileLoading) return null
  if (!profile) return null
  if (profile.plan !== 'pro') return <ProGate profile={profile}>{null}</ProGate>
  if (!session && !loading) return null

  const typing = <div className={styles.typing} aria-label="Socrate écrit"><span /><span /><span /></div>

  return (
    <div className={styles.sessionPage}>
      <header className={styles.sessionHeader}>
        <Link href="/socrate/new" className={styles.backLink}><ArrowLeft size={15} aria-hidden="true" /><span>Quitter</span></Link>
        <span className={styles.headerDivider} aria-hidden="true" />
        <div className={styles.sessionTitle}><Lightbulb size={16} weight="fill" aria-hidden="true" />Socrate{session ? ` — ${session.content_title}` : ''}</div>
        {!diagnosis && messages.length >= 4 ? (
          <button onClick={handleDiagnose} disabled={diagnosing} className={styles.secondaryButton}>
            {diagnosing ? 'Analyse…' : 'Terminer et diagnostiquer'}
          </button>
        ) : <div className={styles.statusDots} data-loading={loading ? 'true' : 'false'} aria-label={loading ? 'Chargement' : undefined}><span /><span /><span /></div>}
      </header>

      <main className={styles.messages}>
        {messages.length === 0 && loading && <div className={styles.messageRow} data-role="assistant"><div className={styles.message}><p className={styles.messageLabel}>Socrate</p>{typing}</div></div>}
        {messages.map((message, index) => (
          <div key={index} className={styles.messageRow} data-role={message.role}>
            <div className={styles.message}>
              {message.role === 'assistant' && <p className={styles.messageLabel}>Socrate</p>}
              {message.content}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && <div className={styles.messageRow} data-role="assistant"><div className={styles.message}><p className={styles.messageLabel}>Socrate</p>{typing}</div></div>}

        {diagnosis && (
          <section className={styles.diagnosisPanel} aria-labelledby="diagnosis-title">
            <div className={styles.diagnosisHeader}>
              <CheckCircle size={19} weight="fill" aria-hidden="true" />
              <h2 id="diagnosis-title">Diagnostic Socrate</h2>
              <span className={styles.score}>{diagnosis.clarity_score}/100</span>
            </div>
            {diagnosis.well_explained.length > 0 && <div className={styles.diagnosisGroup}><p className={styles.diagnosisSectionTitle}><CheckCircle size={14} weight="fill" />Ta meilleure explication</p><ul className={styles.diagnosisList}>{diagnosis.well_explained.map((item, index) => <li key={index}><CheckCircle size={15} weight="fill" />{item}</li>)}</ul></div>}
            {diagnosis.still_unclear.length > 0 && <div className={styles.diagnosisGroup}><p className={styles.diagnosisSectionTitle}><WarningCircle size={14} weight="fill" />Encore flou</p><ul className={styles.diagnosisList}>{diagnosis.still_unclear.map((item, index) => <li key={index}><WarningCircle size={15} weight="fill" />{item}</li>)}</ul></div>}
            {diagnosis.best_explanation && <div className={styles.bestExplanation}><p className={styles.diagnosisSectionTitle}>Ta meilleure explication</p><p>&ldquo;{diagnosis.best_explanation}&rdquo;</p></div>}
            {diagnosis.suggestions.length > 0 && <div className={styles.diagnosisGroup}><p className={styles.diagnosisSectionTitle}><BookOpen size={14} />À revoir</p><ul className={styles.diagnosisList}>{diagnosis.suggestions.map((item, index) => <li key={index}><BookOpen size={15} />{item}</li>)}</ul></div>}
          </section>
        )}
        <div ref={bottomRef} />
      </main>

      {!diagnosis && <footer className={styles.composer}><div className={styles.composerInner}><input ref={inputRef} type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && sendMessage()} disabled={loading} placeholder="Réponds à Socrate…" className={styles.composerInput} /><button onClick={sendMessage} disabled={loading || !input.trim()} className={styles.iconButton} aria-label="Envoyer la réponse"><PaperPlaneTilt size={17} weight="fill" aria-hidden="true" /></button></div></footer>}
    </div>
  )
}
