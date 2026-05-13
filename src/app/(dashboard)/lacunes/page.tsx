'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { KpiStrip } from '@/components/lacunes/KpiStrip'
import { WeaknessCardList } from '@/components/lacunes/WeaknessCardList'
import { AnalysisPanel } from '@/components/lacunes/AnalysisPanel'
import { EmptyState } from '@/components/lacunes/EmptyState'
import { ProGate } from '@/components/pro-gate'
import { createClient } from '@/lib/supabase/client'
import type { MockCard, MockStats, LacunesAnalysis } from '@/lib/lacunes/mock'
import type { Profile } from '@/types'
import { trackLacunesOpen, trackLacunesAnalyze } from '@/lib/analytics'

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
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw size={20} className="animate-spin text-indigo-400" />
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
    <div className="max-w-350">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="text-4xl text-white leading-tight tracking-tight">
            Lacunes
          </h1>
          <p
            className="text-xs text-[#475569] mt-1.5"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            Basé sur {data.stats.sessions} révisions &nbsp;·&nbsp; {data.lacunes.length} point{data.lacunes.length > 1 ? 's' : ''} faible{data.lacunes.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          style={{ background: '#818CF8' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Analyse...' : "Relancer l'analyse"}
        </button>
      </div>

      {/* ─── KPI strip ─────────────────────────────────────── */}
      <KpiStrip stats={data.stats} />

      {/* ─── Two-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] gap-8">
        <div className="min-w-0">
          <WeaknessCardList cards={cards} />
        </div>
        <div className="min-w-0">
          <AnalysisPanel
            analysis={data.analysis}
            stats={data.stats}
            totalCards={cards.length}
          />
        </div>
      </div>
    </div>
  )
}
