'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, BookOpen, MessagesSquare } from 'lucide-react'
import type { MockCard } from '@/lib/lacunes/mock'

function failColor(rate: number): string {
  if (rate >= 75) return '#EF4444'
  if (rate >= 50) return '#F59E0B'
  return '#22C55E'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface WeaknessCardProps {
  card: MockCard
  index: number
}

export function WeaknessCard({ card, index }: WeaknessCardProps) {
  const [open, setOpen] = useState(false)
  const color = failColor(card.failRate)
  const correct = card.attempts.filter(Boolean).length
  const wrong = card.attempts.length - correct

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 animate-fade-up"
      style={{
        background: 'var(--surface)',
        borderColor: open ? color + '30' : 'var(--border)',
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header row — clickable */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Fail rate */}
          <div
            className="w-14 flex-shrink-0 text-center"
          >
            <span
              className="text-3xl leading-none font-normal tracking-tight"
              style={{ color }}
            >
              {card.failRate}%
            </span>
          </div>

          {/* Question */}
          <p className="flex-1 text-sm font-medium text-white leading-snug text-left">
            {card.question}
          </p>

          {/* Right meta */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <span
              className="text-xs text-[#475569] tabular-nums hidden sm:block"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              {wrong}/{card.attempts.length} ratées
            </span>
            <ChevronDown
              size={16}
              className="text-[#475569] transition-transform duration-200"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-px mx-5 mb-0" style={{ background: 'var(--border)' }} />
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
        <div className="px-5 py-4 space-y-4 border-t border-[#1E1E2E]">
          {/* Answer */}
          <p className="text-sm text-[#94A3B8] leading-relaxed pl-2 border-l-2 border-[#1E1E2E]">
            {card.answer}
          </p>

          {/* Attempt timeline */}
          <div>
            <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-2">
              5 dernières tentatives
            </p>
            <div className="flex items-center gap-2">
              {card.attempts.map((correct, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 transition-all"
                    style={{
                      background: correct ? '#22C55E20' : '#EF444420',
                      borderColor: correct ? '#22C55E' : '#EF4444',
                    }}
                  />
                  <span
                    className="text-[9px] text-[#334155] tabular-nums"
                    style={{ fontFamily: 'var(--font-mono, monospace)' }}
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', color: '#818CF8' }}
            >
              <BookOpen size={12} />
              Revoir cette carte
            </Link>
            <Link
              href="/socrate/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
            >
              <MessagesSquare size={12} />
              Mode Socrate
            </Link>
          </div>

          {/* Last seen */}
          <p
            className="text-[10px] text-[#334155] tabular-nums"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            Vu pour la dernière fois : {formatDate(card.lastSeen)}
          </p>
        </div>
      </div>
    </div>
  )
}
