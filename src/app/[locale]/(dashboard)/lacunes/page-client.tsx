'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { RefreshCw } from 'lucide-react'
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
  const t = useTranslations('dashboard.lacunes')
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw size={20} className="animate-spin" style={{ color: COLOR }} />
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">{t('label')}</Eyebrow>
          <h1 className="section-h">{t('title')}</h1>
          <p className="mono text-xs mt-2" style={{ color: 'var(--ink-400)' }}>
            {t('basedOn', {sessions: data.stats.sessions, count: data.lacunes.length})}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline shrink-0"
          style={{ padding: '10px 16px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {/* KPI strip */}
      <KpiStrip stats={data.stats} />

      {/* Two-column layout */}
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
