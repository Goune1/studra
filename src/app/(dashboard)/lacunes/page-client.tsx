'use client'

import { useState, useEffect } from 'react'
import { ArrowClockwise } from '@phosphor-icons/react'
import { KpiStrip } from '@/components/lacunes/KpiStrip'
import { WeaknessCardList } from '@/components/lacunes/WeaknessCardList'
import { AnalysisPanel } from '@/components/lacunes/AnalysisPanel'
import { EmptyState } from '@/components/lacunes/EmptyState'
import { ProGate } from '@/components/pro-gate'
import { createClient } from '@/lib/supabase/client'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { MockCard, MockStats, LacunesAnalysis } from '@/lib/lacunes/mock'
import type { Profile } from '@/types'
import { trackLacunesOpen, trackLacunesAnalyze } from '@/lib/analytics'
import styles from './lacunes.module.css'

const COLOR = '#1F4D3F'

interface ApiResponse {
  lacunes: Array<{
    flashcard_id: string
    question: string
    answer: string
    wrong_count: number
    total_count: number
    wrong_rate: number
  }>
  analysis: LacunesAnalysis
  stats: MockStats
}

export default function LacunesPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      trackLacunesOpen(user.id)
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data as Profile)
        setProfileLoading(false)
      })
    })
  }, [])

  useEffect(() => {
    if (profile?.plan === 'pro') {
      fetchLacunes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function fetchLacunes() {
    setLoading(true)
    trackLacunesAnalyze(profile?.id ?? 'anonymous')
    try {
      const res = await fetch('/api/analyze/lacunes')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/analyze/lacunes')
      const json = await res.json()
      setData(json)
    } finally {
      setRefreshing(false)
    }
  }

  if (profileLoading) return null
  if (!profile) return null

  if (profile.plan !== 'pro') {
    return <ProGate profile={profile}>{null}</ProGate>
  }

  if (loading) {
    return (
      <div className={styles.loadingState} role="status" aria-label="Analyse des lacunes en cours">
        <ArrowClockwise size={20} weight="regular" className={styles.spinner} style={{ color: COLOR }} aria-hidden="true" />
        <span>Analyse de tes révisions…</span>
      </div>
    )
  }

  if (!data || data.lacunes.length === 0) {
    return <EmptyState />
  }

  const cards: MockCard[] = data.lacunes.map((l) => ({
    id: l.flashcard_id,
    question: l.question,
    answer: l.answer,
    failRate: Math.round(l.wrong_rate * 100),
    attempts: Array.from({ length: l.total_count }, (_, i) => i >= l.wrong_count),
    lastSeen: new Date().toISOString().slice(0, 10),
    deckId: '',
  }))

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <Eyebrow className={styles.eyebrow}>{"Lacunes"}</Eyebrow>
          <h1>Mes points faibles</h1>
          <p className={styles.pageSummary}>
            {`Basé sur ${data.stats.sessions} révisions · ${data.lacunes.length} point${data.lacunes.length === 1 ? "" : "s"} faible${data.lacunes.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className={styles.refreshButton}
        >
          <ArrowClockwise size={15} weight="regular" className={refreshing ? styles.spinner : undefined} aria-hidden="true" />
          {refreshing ? "Analyse…" : "Relancer l’analyse"}
        </button>
      </header>

      <section className={styles.metrics} aria-label="Résumé de l’analyse">
        <KpiStrip stats={data.stats} />
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.weaknesses} aria-label="Cartes à retravailler">
          <WeaknessCardList cards={cards} />
        </section>
        <aside className={styles.analysis} aria-label="Diagnostic et conseils">
          <AnalysisPanel
            analysis={data.analysis}
            stats={data.stats}
            totalCards={cards.length}
          />
        </aside>
      </div>
    </div>
  )
}
