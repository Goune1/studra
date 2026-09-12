'use client'

import { useState, useMemo } from 'react'
import { WeaknessCard } from './WeaknessCard'
import type { MockCard } from '@/lib/lacunes/mock'
type SortKey = 'failRate' | 'lastSeen' | 'alpha'

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
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
            {"Cartes à retravailler"}
          </h2>
          <span
            className=" text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444425' }}
          >
            {cards.length}
          </span>
        </div>

        {/* Sort toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
        >
          {(['failRate', 'lastSeen', 'alpha'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="px-2.5 py-1.5 rounded-lg  text-[10px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: sort === key ? 'var(--accent-soft)' : 'transparent',
                color: sort === key ? 'var(--accent)' : 'var(--ink-400)',
              }}
            >
              {key === 'failRate' ? 'Taux de réussite' : key === 'lastSeen' ? 'À retravailler' : 'Points faibles'}{sort === key && key === 'failRate' ? ' ↓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Critical section */}
      {critical.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className=" text-[9px] font-bold uppercase tracking-widest" style={{ color: '#EF4444' }}>
              {"Priorité"}
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
            <span className=" text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-400)' }}>
              {"Points faibles"}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--ink-200)' }} />
          </div>
          {watchlist.map((card, i) => (
            <WeaknessCard key={card.id} card={card} index={critical.length + i} />
          ))}
        </div>
      )}
    </div>
  )
}
