'use client'

import {
  Sparkles,
  BookOpen,
  Link as LinkIcon,
  Repeat,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import { useTranslations } from 'next-intl'
import type { LacunesAnalysis } from '@/lib/lacunes/mock'
import type { MockStats } from '@/lib/lacunes/mock'

const COLOR = '#1F4D3F'

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Link: LinkIcon,
  Repeat,
  Users,
}

interface AnalysisPanelProps {
  analysis: LacunesAnalysis
  stats: MockStats
  totalCards: number
}

export function AnalysisPanel({ analysis, stats, totalCards }: AnalysisPanelProps) {
  const t = useTranslations('dashboard.lacunes')
  const weakCount = stats.weakPoints
  const masteredCount = totalCards - weakCount

  return (
    <div
      className="rounded-2xl p-6 space-y-6 sticky top-8"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Panel header */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} style={{ color: COLOR }} />
          <span
            className="mono text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: COLOR }}
          >
            {t('analysis')}
          </span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
          {t('diagnosis')}
        </h2>
      </div>

      {/* Score ring */}
      <div className="flex justify-center py-2">
        <ScoreRing
          rate={stats.successRate}
          masteredCount={masteredCount}
          weakCount={weakCount}
        />
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Diagnostic */}
      <div className="space-y-3">
        {/* Summary callout */}
        <div
          className="px-4 py-3 rounded-xl"
          style={{ background: 'var(--accent-soft)' }}
        >
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--ink-700)' }}>
            {analysis.diagnostic.summary}
          </p>
        </div>

        {/* Bullet points */}
        <div className="space-y-2">
          {analysis.diagnostic.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: COLOR }}
              />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-700)' }}>{bullet}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Conseils */}
      <div className="space-y-2">
        <p
          className="mono text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--ink-400)' }}
        >
          {t('recommendation')}
        </p>

        {analysis.conseils.map((conseil, i) => {
          const Icon = ICON_MAP[conseil.icon] ?? BookOpen
          return (
            <div
              key={i}
              className="flex gap-3 px-3 py-3 rounded-xl transition-all duration-150 hover:-translate-y-0.5 cursor-default"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: COLOR + '15' }}
              >
                <Icon size={13} style={{ color: COLOR }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{conseil.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>{conseil.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Encouragement */}
      <p
        className="text-xs text-center leading-relaxed italic"
        style={{ color: 'var(--ink-500)' }}
      >
        {analysis.encouragement}
      </p>
    </div>
  )
}
