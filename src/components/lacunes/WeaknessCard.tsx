'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { ChevronDown, BookOpen, MessagesSquare } from 'lucide-react'
import type { MockCard } from '@/lib/lacunes/mock'

const COLOR = '#1F4D3F'

function failColor(rate: number): string {
  if (rate >= 75) return '#EF4444'
  if (rate >= 50) return '#F59E0B'
  return '#10B981'
}

interface WeaknessCardProps {
  card: MockCard
  index: number
}

export function WeaknessCard({ card, index }: WeaknessCardProps) {
  const t = useTranslations('dashboard.lacunes')
  const format = useFormatter()
  const [open, setOpen] = useState(false)
  const color = failColor(card.failRate)
  const correct = card.attempts.filter(Boolean).length
  const wrong = card.attempts.length - correct

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 animate-fade-up"
      style={{
        background: 'var(--surface)',
        border: open ? `1px solid ${color}30` : '1px solid var(--border)',
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header row — clickable */}
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left cursor-pointer">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Fail rate */}
          <div className="w-14 flex-shrink-0 text-center">
            <span className="text-3xl leading-none font-semibold tracking-tight" style={{ color }}>
              {card.failRate}%
            </span>
          </div>

          {/* Question */}
          <p className="flex-1 text-sm font-medium leading-snug text-left" style={{ color: 'var(--ink)' }}>
            {card.question}
          </p>

          {/* Right meta */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <span
              className="mono text-xs hidden sm:block tabular-nums"
              style={{ color: 'var(--ink-400)' }}
            >
              {wrong}/{card.attempts.length} {t('review')}
            </span>
            <ChevronDown
              size={16}
              style={{ color: 'var(--ink-400)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-px mx-5" style={{ background: 'var(--border)' }} />
        <div className="h-[3px] rounded-b-sm overflow-hidden">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${card.failRate}%`, background: color }}
          />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '420px' : '0px' }}
      >
        <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Answer */}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            {card.answer}
          </p>

          {/* Attempt timeline */}
          <div>
            <p className="mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--ink-400)' }}>
              {t('sessions')}
            </p>
            <div className="flex items-center gap-2">
              {card.attempts.map((ok, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 transition-all"
                    style={{
                      background: ok ? '#10B98120' : '#EF444420',
                      borderColor: ok ? '#10B981' : '#EF4444',
                    }}
                  />
                  <span
                    className="mono text-[9px] tabular-nums"
                    style={{ color: 'var(--ink-400)' }}
                  >
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/flashcards/${card.deckId}/study?card=${card.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: COLOR + '12', border: `1px solid ${COLOR}30`, color: COLOR }}
            >
              <BookOpen size={12} />
              {t('review')}
            </Link>
            <Link
              href="/socrate/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
            >
              <MessagesSquare size={12} />
              {t('socrate')}
            </Link>
          </div>

          {/* Last seen */}
          <p className="mono text-[10px] tabular-nums" style={{ color: 'var(--ink-400)' }}>
            {t('lastSeen', {date: format.dateTime(new Date(card.lastSeen), {day: 'numeric', month: 'short', year: 'numeric'})})}
          </p>
        </div>
      </div>
    </div>
  )
}
