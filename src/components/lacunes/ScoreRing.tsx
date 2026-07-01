'use client'

import { useEffect, useState } from 'react'

const RADIUS = 44
const STROKE = 8
const SIZE = (RADIUS + STROKE) * 2
const CIRC = 2 * Math.PI * RADIUS

function ringColor(rate: number): string {
  if (rate >= 75) return '#10B981'
  if (rate >= 50) return '#F59E0B'
  return '#EF4444'
}

interface ScoreRingProps {
  rate: number
  masteredCount: number
  weakCount: number
}

export function ScoreRing({ rate, masteredCount, weakCount }: ScoreRingProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(id)
  }, [])

  const color = ringColor(rate)
  const offset = animated ? CIRC * (1 - rate / 100) : CIRC
  const cx = SIZE / 2
  const cy = SIZE / 2

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl leading-none tracking-tight font-semibold" style={{ color }}>
            {rate}%
          </span>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--ink-500)' }}>Taux de réussite global</p>

      {/* Flanking stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-lg font-semibold tabular-nums" style={{ color: '#10B981' }}>
            {masteredCount}
          </div>
          <div className="mono text-[10px]" style={{ color: 'var(--ink-400)' }}>maîtrisées</div>
        </div>
        <div className="w-px" style={{ background: 'var(--border)' }} />
        <div className="text-center">
          <div className="text-lg font-semibold tabular-nums" style={{ color: '#EF4444' }}>
            {weakCount}
          </div>
          <div className="mono text-[10px]" style={{ color: 'var(--ink-400)' }}>à retravailler</div>
        </div>
      </div>
    </div>
  )
}
