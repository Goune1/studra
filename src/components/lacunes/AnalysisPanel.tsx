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
import type { LacunesAnalysis } from '@/lib/lacunes/mock'
import type { MockStats } from '@/lib/lacunes/mock'

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
  const weakCount = stats.weakPoints
  const masteredCount = totalCards - weakCount

  return (
    <div
      className="rounded-2xl border p-6 space-y-6 sticky top-8"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: '0 0 40px rgba(129,140,248,0.07)',
      }}
    >
      {/* Panel header */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} style={{ color: '#818CF8' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: '#818CF8' }}
          >
            Analyse IA
          </span>
        </div>
        <h2
          className="text-2xl text-white tracking-tight"
          style={{  }}
        >
          Diagnostic
        </h2>
      </div>

      {/* ─── A: Score ring ────────────────────────────────── */}
      <div className="flex justify-center py-2">
        <ScoreRing
          rate={stats.successRate}
          masteredCount={masteredCount}
          weakCount={weakCount}
        />
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* ─── B: Diagnostic ────────────────────────────────── */}
      <div className="space-y-3">
        {/* Summary callout */}
        <div
          className="px-4 py-3 rounded-xl"
          style={{
            background: '#818CF808',
            borderLeft: '3px solid #818CF8',
          }}
        >
          <p
            className="text-sm text-[#C7D2FE] leading-relaxed italic"
          >
            {analysis.diagnostic.summary}
          </p>
        </div>

        {/* Bullet points */}
        <div className="space-y-2">
          {analysis.diagnostic.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: '#818CF8' }}
              />
              <p className="text-xs text-[#94A3B8] leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* ─── C: Conseils ──────────────────────────────────── */}
      <div className="space-y-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-3"
        >
          Conseils ciblés
        </p>

        {analysis.conseils.map((conseil, i) => {
          const Icon = ICON_MAP[conseil.icon] ?? BookOpen
          return (
            <div
              key={i}
              className="flex gap-3 px-3 py-3 rounded-xl border transition-all duration-150 hover:-translate-y-0.5 cursor-default"
              style={{
                background: 'var(--surface-deep)',
                borderColor: 'var(--border)',
                borderLeft: '2px solid rgba(129,140,248,0.19)',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(129,140,248,0.38)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(129,140,248,0.19)'
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#818CF810' }}
              >
                <Icon size={13} style={{ color: '#818CF8' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white mb-0.5">{conseil.title}</p>
                <p className="text-[11px] text-[#64748B] leading-relaxed">{conseil.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── D: Encouragement ─────────────────────────────── */}
      <p
        className="text-xs text-center leading-relaxed italic"
        style={{ color: '#475569' }}
      >
        {analysis.encouragement}
      </p>
    </div>
  )
}
