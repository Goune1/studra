'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlashCard } from '@/components/flashcards/FlashCard'
import type { DueCard } from '@/lib/fsrs/service'
import type { RatingPreview } from '@/lib/fsrs/types'
import Link from 'next/link'
import { ArrowCounterClockwise, ArrowLeft, CheckCircle, Clock, SpinnerGap } from '@phosphor-icons/react'
import { trackFlashcardsSessionStart, trackFlashcardsSessionComplete, trackFlashcardsSessionAbandoned } from '@/lib/analytics'
import styles from './study.module.css'

const RATING_COLORS: Record<number, string> = {
  1: '#B4503C',
  2: '#A8762E',
  3: '#1F4D3F',
  4: '#3E6B7A',
}

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

export default function StudyPage() {
  const format = ({number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('fr-FR', options).format(value), dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', options).format(new Date(value)), relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => new Intl.RelativeTimeFormat('fr-FR', {numeric: 'auto'}).format(value, unit)})
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
  }, [cards, currentIndex, finished, deckId, isFlipped])

  function restart() {
    setCurrentIndex(0)
    setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setFinished(false)
    setIsFlipped(false)
  }

  if (loading) {
    return (
      <div className={styles.centerState}>
        <div className={styles.loadingCard}>
          <SpinnerGap size={20} className={styles.spinner} aria-hidden="true" />
          <div><strong>Préparation de la session</strong><span>Studra cherche les cartes arrivées à échéance.</span></div>
        </div>
      </div>
    )
  }

  if (noCards) {
    const nextDate = nextDueAt
      ? format.dateTime(new Date(nextDueAt), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : null
    return (
      <div className={styles.centerState}>
        <section className={styles.doneCard}>
          <div className={styles.doneIcon}><CheckCircle size={24} weight="regular" aria-hidden="true" /></div>
          <p className={styles.stateLabel}>Rien à réviser maintenant</p>
          <h1>Ce deck est à jour.</h1>
          <p>{totalInDeck} carte{totalInDeck > 1 ? 's' : ''} dans ce deck, aucune n’est arrivée à échéance.</p>
          {nextDate && <span className={styles.nextReview}><Clock size={14} /> Prochaine révision : {nextDate}</span>}
          <Link href={`/flashcards/${deckId}`} className={styles.stateButton}><ArrowLeft size={14} /> Retour au deck</Link>
        </section>
      </div>
    )
  }

  if (finished) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    const retained = stats.good + stats.easy
    const score = total > 0 ? Math.round((retained / total) * 100) : 0

    return (
      <div className={styles.centerState}>
        <section className={styles.resultsCard}>
          <div className={styles.resultsIntro}>
            <p className={styles.stateLabel}>Session terminée</p>
            <h1>{score}% retenues</h1>
            <p>{deckTitle}</p>
          </div>
          <div className={styles.resultRows}>
            {([
              { label: 'À revoir', value: stats.again, color: RATING_COLORS[1] },
              { label: 'Difficile', value: stats.hard, color: RATING_COLORS[2] },
              { label: 'Bien', value: stats.good, color: RATING_COLORS[3] },
              { label: 'Facile', value: stats.easy, color: RATING_COLORS[4] },
            ] as const).map(({ label, value, color }) => (
              <div key={label}><span style={{ color }}>{value}</span><small>{label}</small></div>
            ))}
          </div>
          <div className={styles.resultActions}>
            <button type="button" onClick={restart}><ArrowCounterClockwise size={15} /> Recommencer</button>
            <Link href={`/flashcards/${deckId}`}>Retour au deck</Link>
          </div>
        </section>
      </div>
    )
  }

  const card = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className={styles.studyPage}>
      <header className={styles.studyHeader}>
        <Link href={`/flashcards/${deckId}`}><ArrowLeft size={14} /> Quitter</Link>
        <div className={styles.studyProgress}>
          <div><span>{deckTitle}</span><strong>{currentIndex + 1} sur {cards.length}</strong></div>
          <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
        </div>
        <div className={styles.liveStats}>
          <span style={{ color: RATING_COLORS[1] }}>{stats.again} à revoir</span>
          <span style={{ color: RATING_COLORS[3] }}>{stats.good + stats.easy} retenues</span>
        </div>
      </header>

      <main className={styles.studyMain}>
        <FlashCard
          key={card.id}
          question={card.question}
          answer={card.answer}
          onFlipChange={handleFlipChange}
        />

        {isFlipped && (
          <section className={styles.ratingPanel} aria-label="Évaluer la difficulté de la carte">
            <div className={styles.ratingPrompt}>
              <span>Ta réponse</span>
              <strong>À quel point était-ce difficile ?</strong>
            </div>
            <div className={styles.ratingButtons}>
              {([1, 2, 3, 4] as const).map((rating) => {
                const preview = currentPreview.find((item) => item.rating === rating)
                const color = preview?.color ?? RATING_COLORS[rating]
                const label = preview?.label ?? ['À revoir', 'Difficile', 'Bien', 'Facile'][rating - 1]
                return (
                  <button type="button" key={rating} onClick={() => handleRate(rating)} title={`${rating} · ${label}`}>
                    <span style={{ color }}>{rating}</span>
                    <strong>{label}</strong>
                    {preview?.intervalLabel && <small>{preview.intervalLabel}</small>}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
