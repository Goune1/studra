'use client'

import { useState, useMemo } from 'react'
import { WeaknessCard } from './WeaknessCard'
import type { MockCard } from '@/lib/lacunes/mock'

type SortKey = 'failRate' | 'lastSeen' | 'alpha'

const SORT_LABELS: Record<SortKey, string> = {
  failRate: 'Taux d\'échec',
  lastSeen: 'Dernière révision',
  alpha: 'Alphabétique',
}

const CRITICAL_THRESHOLD = 50

interface WeaknessCardListProps {
  cards: MockCard[]
}

export function WeaknessCardList({ cards }: WeaknessCardListProps) {
  const [sort, setSort] = useState<SortKey>('failRate')

  const sorted = useMemo(() => {
    return [...cards].sort((a, b) => {
      if (sort === 'failRate') return b.failRate - a.failRate
      if (sort === 'lastSeen')
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      return a.question.localeCompare(b.question, 'fr')
    })
  }, [cards, sort])

  const critical = sorted.filter((c) => c.failRate >= CRITICAL_THRESHOLD)
  const watchlist = sorted.filter((c) => c.failRate < CRITICAL_THRESHOLD)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2
            className="text-xl text-white"
            style={{  }}
          >
            Cartes à retravailler
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444425' }}
          >
            {cards.length}
          </span>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[#1E1E2E] bg-[#13131A]">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150"
              style={{
                background: sort === key ? 'var(--surface-2)' : 'transparent',
                color: sort === key ? 'var(--text-1)' : 'var(--text-4)',
              }}
            >
              {SORT_LABELS[key]}
              {sort === key && key === 'failRate' ? ' ↓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Critical section */}
      {critical.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: '#EF4444' }}
            >
              Critique
            </span>
            <div className="flex-1 h-px" style={{ background: '#EF444420' }} />
          </div>
          {critical.map((card, i) => (
            <WeaknessCard key={card.id} card={card} index={i} />
          ))}
        </div>
      )}

      {/* Watchlist section */}
      {watchlist.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: '#475569' }}
            >
              À surveiller
            </span>
            <div className="flex-1 h-px border-t border-dashed border-[#1E1E2E]" />
          </div>
          {watchlist.map((card, i) => (
            <WeaknessCard key={card.id} card={card} index={critical.length + i} />
          ))}
        </div>
      )}
    </div>
  )
}
