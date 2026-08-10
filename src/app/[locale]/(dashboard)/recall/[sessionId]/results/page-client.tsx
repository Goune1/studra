'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { FreeRecallSession } from '@/types'

const COLOR = '#1F4D3F'

function ScoreRing({ score }: { score: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="mono text-xs block" style={{ color: 'var(--ink-400)' }}>/100</span>
      </div>
    </div>
  )
}

export default function RecallResultsPage() {
  const t = useTranslations('dashboard.recall')
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<FreeRecallSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('free_recall_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!data || !data.evaluation) { router.push('/recall/new'); return }
      setSession(data as FreeRecallSession)
      setLoading(false)
    }
    load()
  }, [sessionId, router])

  if (loading || !session?.evaluation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm" style={{ color: 'var(--ink-400)' }}>{t('loading')}</div>
      </div>
    )
  }

  const { evaluation } = session

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">{t('label')}</Eyebrow>
          <h1 className="section-h">{t('results')}</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-500)' }}>
            {session.content_title}
          </p>
        </div>
        <ScoreRing score={evaluation.score} />
      </div>

      {/* Covered notions */}
      {evaluation.notions_couvertes.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} style={{ color: '#10B981' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Notions couvertes ({evaluation.notions_couvertes.length})
            </h2>
          </div>
          <ul className="space-y-1.5">
            {evaluation.notions_couvertes.map((n, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--ink-700)' }}>
                <span style={{ color: '#10B981' }}>✓</span> {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed notions */}
      {evaluation.notions_oubliees.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={16} style={{ color: '#EF4444' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {t('gaps')} ({evaluation.notions_oubliees.length})
            </h2>
          </div>
          <ul className="space-y-1.5">
            {evaluation.notions_oubliees.map((n, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--ink-700)' }}>
                <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {evaluation.erreurs.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '120ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} style={{ color: '#F59E0B' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {t('analysis')}
            </h2>
          </div>
          <ul className="space-y-1.5">
            {evaluation.erreurs.map((e, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--ink-700)' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested flashcards */}
      {evaluation.flashcards_suggerees.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-6 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '150ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} style={{ color: COLOR }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {t('flashcards')}
            </h2>
          </div>
          <div className="space-y-3">
            {evaluation.flashcards_suggerees.map((fc, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <p className="mono text-xs font-semibold mb-1" style={{ color: COLOR }}>Q</p>
                <p className="text-sm mb-2" style={{ color: 'var(--ink)' }}>{fc.question}</p>
                <p className="mono text-xs font-semibold mb-1" style={{ color: 'var(--ink-500)' }}>R</p>
                <p className="text-sm" style={{ color: 'var(--ink-700)' }}>{fc.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <Link
          href="/recall/new"
          className="btn btn-outline flex-1"
        >
          <RefreshCw size={14} /> Nouvelle session
        </Link>
        <Link
          href="/flashcards"
          className="btn btn-primary flex-1"
        >
          <Layers size={14} /> Mes flashcards
        </Link>
      </div>
    </div>
  )
}
