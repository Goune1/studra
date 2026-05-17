'use client'

import { useMemo, useState } from 'react'
import type { AdminUser } from '@/lib/admin/mock-data'

type Period = 'day' | 'week' | 'month'

interface Props {
  users: AdminUser[]
}

interface ChartPoint {
  label: string
  value: number
}

const PERIODS: { key: Period; label: string; emptyLabel: string }[] = [
  { key: 'day', label: 'Jour', emptyLabel: '30 derniers jours' },
  { key: 'week', label: 'Semaine', emptyLabel: '12 dernières semaines' },
  { key: 'month', label: 'Mois', emptyLabel: '12 derniers mois' },
]

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date) {
  const day = date.getDay() || 7
  const start = startOfDay(date)
  start.setDate(start.getDate() - day + 1)
  return start
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function keyFor(date: Date, period: Period) {
  if (period === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const normalized = period === 'week' ? startOfWeek(date) : startOfDay(date)
  return normalized.toISOString().slice(0, 10)
}

function labelFor(date: Date, period: Period) {
  if (period === 'month') return MONTHS[date.getMonth()]
  if (period === 'week') return `${date.getDate()} ${MONTHS[date.getMonth()]}`
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

function buildSeries(users: AdminUser[], period: Period): ChartPoint[] {
  const now = new Date()
  const bucketCount = period === 'day' ? 30 : period === 'week' ? 12 : 12
  const stepDays = period === 'week' ? 7 : 1
  const buckets: { date: Date; key: string; label: string; value: number }[] = []

  let start: Date
  if (period === 'month') {
    start = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -(bucketCount - 1))
  } else if (period === 'week') {
    start = addDays(startOfWeek(now), -(bucketCount - 1) * stepDays)
  } else {
    start = addDays(startOfDay(now), -(bucketCount - 1))
  }

  for (let i = 0; i < bucketCount; i++) {
    const date = period === 'month' ? addMonths(start, i) : addDays(start, i * stepDays)
    buckets.push({ date, key: keyFor(date, period), label: labelFor(date, period), value: 0 })
  }

  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]))
  for (const user of users) {
    const createdAt = new Date(user.createdAt)
    const index = indexByKey.get(keyFor(createdAt, period))
    if (index !== undefined) buckets[index].value += 1
  }

  return buckets.map(({ label, value }) => ({ label, value }))
}

function linePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

export function NewUsersChart({ users }: Props) {
  const [period, setPeriod] = useState<Period>('day')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const series = useMemo(() => buildSeries(users, period), [users, period])
  const maxValue = Math.max(1, ...series.map(point => point.value))
  const total = series.reduce((sum, point) => sum + point.value, 0)
  const activePeriod = PERIODS.find(item => item.key === period)

  const width = 960
  const height = 260
  const paddingX = 28
  const paddingTop = 24
  const paddingBottom = 42
  const chartHeight = height - paddingTop - paddingBottom
  const step = series.length > 1 ? (width - paddingX * 2) / (series.length - 1) : 0
  const points = series.map((point, index) => ({
    x: paddingX + index * step,
    y: paddingTop + chartHeight - (point.value / maxValue) * chartHeight,
  }))
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null
  const hoveredData = hoveredIndex !== null ? series[hoveredIndex] : null
  const tooltipWidth = 150
  const tooltipHeight = 52
  const tooltipX = hoveredPoint ? Math.min(Math.max(hoveredPoint.x - tooltipWidth / 2, 8), width - tooltipWidth - 8) : 0
  const tooltipY = hoveredPoint ? Math.max(hoveredPoint.y - tooltipHeight - 14, 8) : 0
  const path = linePath(points)
  const areaPath = points.length
    ? `${path} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : ''
  const labelStep = period === 'day' ? 6 : period === 'week' ? 2 : 1

  return (
    <section className="bg-[#161616] border border-[#222222] rounded-lg p-4 mb-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Nouveaux membres</h2>
          <p className="text-xs text-gray-500 mt-1">
            {total.toLocaleString('fr-FR')} nouveau{total > 1 ? 'x' : ''} membre{total > 1 ? 's' : ''} sur {activePeriod?.emptyLabel}
          </p>
        </div>

        <div className="inline-flex self-start rounded-md border border-[#262626] bg-[#111111] p-1">
          {PERIODS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                period === item.key
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[260px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
          aria-label="Évolution des nouveaux membres"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="new-users-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="new-users-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </linearGradient>
          </defs>

          {[0, 0.33, 0.66, 1].map(tick => {
            const y = paddingTop + chartHeight * tick
            return (
              <line
                key={tick}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#242424"
                strokeWidth="1"
              />
            )
          })}

          {areaPath && <path d={areaPath} fill="url(#new-users-area)" />}
          {path && <path d={path} fill="none" stroke="url(#new-users-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {points.map((point, index) => (
            <g key={`${series[index].label}-${index}`}>
              <rect
                x={point.x - Math.max(step / 2, 12)}
                y={paddingTop}
                width={Math.max(step, 24)}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                tabIndex={0}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 5 : series[index].value > 0 ? 3 : 0}
                fill="#A7F3D0"
                stroke={hoveredIndex === index ? '#064E3B' : 'transparent'}
                strokeWidth="2"
              />
            </g>
          ))}

          {hoveredPoint && hoveredData && (
            <g className="pointer-events-none">
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1={paddingTop}
                y2={height - paddingBottom}
                stroke="#34D399"
                strokeOpacity="0.22"
                strokeWidth="1"
              />
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="8"
                fill="#0F1714"
                stroke="#1F3D34"
              />
              <text x={tooltipX + 12} y={tooltipY + 21} className="fill-gray-400 font-mono text-[10px]">
                {hoveredData.label}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 39} className="fill-white font-mono text-[13px] font-semibold">
                {hoveredData.value} nouveau{hoveredData.value > 1 ? 'x' : ''} membre{hoveredData.value > 1 ? 's' : ''}
              </text>
            </g>
          )}

          {series.map((point, index) => {
            if (index % labelStep !== 0 && index !== series.length - 1) return null
            return (
              <text
                key={`${point.label}-${index}`}
                x={paddingX + index * step}
                y={height - 14}
                textAnchor="middle"
                className="fill-gray-600 font-mono text-[10px]"
              >
                {point.label}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
