'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, ListBullets, Plus } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { FreeRecallSession } from '@/types'
import styles from './recall.module.css'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function RecallIndexClient() {
  const [sessions, setSessions] = useState<FreeRecallSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await createClient().from('free_recall_sessions').select('*').order('created_at', { ascending: false }).limit(30)
      setSessions((data ?? []) as FreeRecallSession[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}><ListBullets size={14} weight="regular" /> Rappel libre</p><h1 className={styles.title}>Tes sessions.</h1><p className={styles.summary}>Retrouve tes derniers rappels et relance une session quand tu veux vérifier ce qui est réellement acquis.</p></div>
        <Link className={styles.primaryButton} href="/recall/new"><Plus size={16} weight="bold" /> Nouvelle session</Link>
      </header>
      {loading ? <div className={styles.loadingState}>Chargement des sessions…</div> : sessions.length === 0 ? (
        <section className={styles.emptyState}><Clock size={24} weight="regular" /><h2>Encore aucune session</h2><p>Choisis un contenu, définis ton temps, puis écris tout ce dont tu te souviens.</p><Link className={styles.primaryButton} href="/recall/new"><Plus size={16} weight="bold" /> Créer une session</Link></section>
      ) : <section className={styles.sessionList}>{sessions.map((session) => {
        const completed = Boolean(session.evaluation)
        return <Link key={session.id} href={completed ? `/recall/${session.id}/results` : `/recall/${session.id}`} className={styles.sessionRow}><div><h2>{session.content_title}</h2><p>{completed ? 'Évaluation disponible' : 'Session à terminer'}</p></div><time className={styles.sessionMeta}>{formatDate(session.created_at)} · {Math.round(session.duration_seconds / 60)} min</time>{completed ? <span className={styles.sessionScore}>{session.evaluation?.score}/100</span> : <ArrowRight size={17} weight="regular" color="var(--accent)" />}</Link>
      })}</section>}
    </div>
  )
}
