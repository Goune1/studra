'use client'

import { BarChart2, AlertTriangle, Target } from 'lucide-react'
import type { MockStats } from '@/lib/lacunes/mock'
import { useTranslations } from 'next-intl'

function scoreColor(rate: number): string {
  if (rate >= 75) return '#22C55E'
  if (rate >= 50) return '#F59E0B'
  return '#EF4444'
}

interface Pill {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  delay: number
}

export function KpiStrip({ stats }: { stats: MockStats }) {
  const t = useTranslations('dashboard.lacunes')
  const pills: Pill[] = [
    {
      icon: <BarChart2 size={15} style={{ color: '#94A3B8' }} />,
      label: t('sessions'),
      value: String(stats.sessions),
      color: '#94A3B8',
      delay: 0,
    },
    {
      icon: <AlertTriangle size={15} style={{ color: '#EF4444' }} />,
      label: t('weaknesses'),
      value: String(stats.weakPoints),
      color: '#EF4444',
      delay: 80,
    },
    {
      icon: <Target size={15} style={{ color: scoreColor(stats.successRate) }} />,
      label: t('score'),
      value: `${stats.successRate}\u00A0%`,
      color: scoreColor(stats.successRate),
      delay: 160,
    },
  ]

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full border animate-fade-up"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            animationDelay: `${pill.delay}ms`,
          }}
        >
          {pill.icon}
          <span className="text-xs" style={{ color: 'var(--text-2)' }}>{pill.label}</span>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{
              color: pill.color,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {pill.value}
          </span>
        </div>
      ))}
    </div>
  )
}
