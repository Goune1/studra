'use client'

import { useEffect, useState } from 'react'

const RADIUS = 44
const STROKE = 8
const SIZE = (RADIUS + STROKE) * 2
const CIRC = 2 * Math.PI * RADIUS

function ringColor(rate: number): string {
  if (rate >= 75) return '#22C55E'
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
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: 'visible' }}
        >
          {/* Glow filter */}
          <defs>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            style={{ stroke: 'var(--border)' }}
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
            filter="url(#ring-glow)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Center label — overlaid as HTML for font rendering */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl leading-none tracking-tight"
            style={{ color }}
          >
            {rate}%
          </span>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] text-center">Taux de réussite global</p>

      {/* Flanking stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div
            className="text-lg font-semibold tabular-nums"
            style={{ color: '#22C55E' }}
          >
            {masteredCount}
          </div>
          <div className="text-[10px] text-[#94A3B8] leading-tight">maîtrisées</div>
        </div>
        <div className="w-px" style={{ background: 'var(--border)' }} />
        <div className="text-center">
          <div
            className="text-lg font-semibold tabular-nums"
            style={{ color: '#EF4444' }}
          >
            {weakCount}
          </div>
          <div className="text-[10px] text-[#94A3B8] leading-tight">à retravailler</div>
        </div>
      </div>
    </div>
  )
}
