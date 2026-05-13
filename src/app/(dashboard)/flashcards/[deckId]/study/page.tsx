'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlashCard } from '@/components/flashcards/FlashCard'
import type { DueCard } from '@/lib/fsrs/service'
import type { RatingPreview } from '@/lib/fsrs/types'
import Link from 'next/link'
import { X, RotateCcw, CheckCircle, Clock } from 'lucide-react'
import { trackFlashcardsSessionStart, trackFlashcardsSessionComplete, trackFlashcardsSessionAbandoned } from '@/lib/analytics'

const COLOR = '#F59E0B'

const RATING_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#22C55E',
  4: '#3B82F6',
}

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

export default function StudyPage() {
  const params = useParams()
  const deckId = params.deckId as string
  const supabase = createClient()

  const [cards, setCards] = useState<DueCard[]>([])
  const [deckTitle, setDeckTitle] = useState('')
  const [totalInDeck, setTotalInDeck] = useState(0)
  const [nextDueAt, setNextDueAt] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPreview, setCurrentPreview] = useState<RatingPreview[]>([])
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 })
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noCards, setNoCards] = useState(false)

  const revealedAtRef = useRef<number | null>(null)
  const sessionStartedAtRef = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const currentIndexRef = useRef(0)
  const cardsRef = useRef<DueCard[]>([])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleRate(parseInt(e.key) as 1 | 2 | 3 | 4)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, currentIndex, cards, finished])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: deck } = await supabase
        .from('decks').select('title').eq('id', deckId).single()
      if (deck) setDeckTitle(deck.title)

      const res = await fetch(`/api/flashcards/${deckId}/due?limit=50`)
      const json = await res.json()
      if (!res.ok) { setLoading(false); return }

      if (json.cards.length === 0) {
        setNoCards(true)
        setTotalInDeck(json.totalInDeck)
        setNextDueAt(json.nextDueAt)
        setLoading(false)
        return
      }

      setCards(json.cards)
      cardsRef.current = json.cards
      setTotalInDeck(json.totalInDeck)
      setNextDueAt(json.nextDueAt)
      setCurrentPreview(json.cards[0]?.preview ?? [])
      setLoading(false)
      sessionStartedAtRef.current = Date.now()
      trackFlashcardsSessionStart(deckId, json.cards.length)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  // Reset flip state + preview when card changes
  useEffect(() => {
    setIsFlipped(false)
    setCurrentPreview(cards[currentIndex]?.preview ?? [])
    revealedAtRef.current = null
  }, [currentIndex, cards])

  // Auto-complétion de la session planning correspondante à la fin du deck
  useEffect(() => {
    if (!finished) return
    finishedRef.current = true
    fetch('/api/study-plans/auto-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: deckId, content_type: 'deck' }),
    }).catch(() => {})
  }, [finished, deckId])

  // Track session complete
  useEffect(() => {
    if (!finished) return
    const total = stats.again + stats.hard + stats.good + stats.easy
    const retained = stats.good + stats.easy
    const score = total > 0 ? Math.round((retained / total) * 100) : 0
    const duration = sessionStartedAtRef.current ? Math.round((Date.now() - sessionStartedAtRef.current) / 1000) : 0
    trackFlashcardsSessionComplete(deckId, score, duration)
  }, [finished, deckId, stats])

  // Track session abandoned on unmount if not finished
  useEffect(() => {
    return () => {
      if (!finishedRef.current && cardsRef.current.length > 0) {
        trackFlashcardsSessionAbandoned(deckId, currentIndexRef.current, cardsRef.current.length)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track when the answer is first revealed
  function handleFlipChange(flipped: boolean) {
    setIsFlipped(flipped)
    if (flipped && revealedAtRef.current === null) {
      revealedAtRef.current = Date.now()
    }
  }

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (finished || currentIndex >= cards.length || !isFlipped) return

    const durationMs = revealedAtRef.current ? Date.now() - revealedAtRef.current : undefined

    setStats((s) => ({
      ...s,
      again: s.again + (rating === 1 ? 1 : 0),
      hard:  s.hard  + (rating === 2 ? 1 : 0),
      good:  s.good  + (rating === 3 ? 1 : 0),
      easy:  s.easy  + (rating === 4 ? 1 : 0),
    }))

    const nextIndex = currentIndex + 1
    if (nextIndex >= cards.length) setFinished(true)
    else {
      currentIndexRef.current = nextIndex
      setCurrentIndex(nextIndex)
    }

    fetch(`/api/flashcards/${deckId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcard_id: cards[currentIndex].id, rating, duration_ms: durationMs }),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, currentIndex, finished, deckId, isFlipped])

  function restart() {
    setCurrentIndex(0)
    setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setFinished(false)
    setIsFlipped(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: COLOR + '20', borderTopColor: COLOR }} />
      </div>
    )
  }

  // ── No cards due ──────────────────────────────────────────────────────────
  if (noCards) {
    const nextDate = nextDueAt
      ? new Date(nextDueAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : null
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-up text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#22C55E15', border: '1px solid #22C55E30' }}>
            <CheckCircle size={28} style={{ color: '#22C55E' }} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Tout est à jour !</h2>
          <p className="text-sm text-[#64748B] mb-2">
            {totalInDeck} carte{totalInDeck > 1 ? 's' : ''} dans ce deck — aucune révision due pour l&apos;instant.
          </p>
          {nextDate && (
            <div className="flex items-center justify-center gap-2 text-xs mb-8" style={{ color: COLOR }}>
              <Clock size={12} />Prochaine révision : {nextDate}
            </div>
          )}
          <Link href={`/flashcards/${deckId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: COLOR }}>
            Retour au deck
          </Link>
        </div>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (finished) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    const retained = stats.good + stats.easy
    const score = total > 0 ? Math.round((retained / total) * 100) : 0
    const sc = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'

    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="rounded-2xl border p-8 text-center mb-6"
            style={{ background: 'var(--surface)', borderLeft: `4px solid ${sc}`, borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-4)' }}>Session terminée</p>
            <div className="text-6xl font-normal mb-2 tracking-tight" style={{ color: sc }}>{score}%</div>
            <p className="text-sm text-[#64748B] mb-6 line-clamp-1">{deckTitle}</p>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {([
                { label: 'À revoir',  value: stats.again, color: RATING_COLORS[1] },
                { label: 'Difficile', value: stats.hard,  color: RATING_COLORS[2] },
                { label: 'Bien',      value: stats.good,  color: RATING_COLORS[3] },
                { label: 'Facile',    value: stats.easy,  color: RATING_COLORS[4] },
              ] as const).map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center"
                  style={{ background: color + '10', border: `1px solid ${color}20` }}>
                  <div className="text-2xl font-semibold tabular-nums tracking-tight"
                    style={{ color, fontFamily: 'var(--font-mono, monospace)' }}>{value}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={restart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <RotateCcw size={13} />Recommencer
            </button>
            <Link href={`/flashcards/${deckId}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 text-center"
              style={{ background: COLOR }}>
              Retour au deck
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Study screen ──────────────────────────────────────────────────────────
  const card = cards[currentIndex]
  const progress = (currentIndex / cards.length) * 100

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 h-14 flex items-center px-4 md:px-8 gap-4 border-b"
        style={{ borderColor: 'var(--border)' }}>
        <Link href={`/flashcards/${deckId}`}
          className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors shrink-0">
          <X size={14} />Quitter
        </Link>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#475569] tabular-nums truncate max-w-48"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}>{deckTitle}</span>
            <span className="text-[10px] text-[#475569] tabular-nums shrink-0"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {currentIndex + 1}/{cards.length}
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: COLOR }} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {stats.again > 0 && (
            <span className="text-[9px] tabular-nums" style={{ color: RATING_COLORS[1], fontFamily: 'var(--font-mono, monospace)' }}>
              {stats.again} ↺
            </span>
          )}
          <span className="text-[9px] tabular-nums" style={{ color: RATING_COLORS[3], fontFamily: 'var(--font-mono, monospace)' }}>
            {stats.good + stats.easy} ✓
          </span>
        </div>
      </div>

      {/* Card area — shrinks to make room for the rating bar */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-auto min-h-0">
        <FlashCard
          key={card.id}
          question={card.question}
          answer={card.answer}
          onFlipChange={handleFlipChange}
          current={currentIndex + 1}
          total={cards.length}
        />
      </div>

      {/* ── Anki-style bottom rating bar ────────────────────────────────── */}
      <div
        className="shrink-0 border-t transition-all duration-300 ease-out overflow-hidden"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--sidebar-bg)',
          height: isFlipped ? 80 : 0,
          opacity: isFlipped ? 1 : 0,
        }}
      >
        <div className="h-full grid grid-cols-4 divide-x" style={{ borderColor: 'var(--border)' }}>
          {([1, 2, 3, 4] as const).map((r) => {
            const p = currentPreview.find((pr) => pr.rating === r)
            const color = p?.color ?? RATING_COLORS[r]
            const label = p?.label ?? ['À revoir', 'Difficile', 'Bien', 'Facile'][r - 1]
            const interval = p?.intervalLabel ?? ''
            return (
              <button
                key={r}
                onClick={() => handleRate(r)}
                className="flex flex-col items-center justify-center gap-0.5 transition-all hover:opacity-80 active:scale-95 divide-x-0"
                style={{ background: color + '08' }}
                title={`${r} — ${label}`}
              >
                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                {interval && (
                  <span className="text-[10px] font-mono" style={{ color: color + 'aa' }}>{interval}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dot navigation */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 flex-wrap py-3 px-4"
        style={{ borderTop: isFlipped ? 'none' : '1px solid var(--border)' }}>
        {cards.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-200"
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              background: i < currentIndex ? COLOR + '60' : i === currentIndex ? COLOR : 'var(--border-2)',
            }} />
        ))}
      </div>
    </div>
  )
}
