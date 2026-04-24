import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const now = new Date()
  const nowIso = now.toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 86_400_000).toISOString()

  // All flashcard FSRS state across user's decks (RLS handles filtering)
  const [cardsRes, reviewsRes] = await Promise.all([
    supabase
      .from('flashcards')
      .select('fsrs_state, fsrs_due'),
    supabase
      .from('flashcard_reviews')
      .select('rating, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo),
  ])

  const cards = cardsRes.data ?? []
  const reviews = reviewsRes.data ?? []

  // Card state counts
  const stateCount = { new: 0, learning: 0, review: 0, relearning: 0 }
  let dueToday = 0
  const forecastMap: Record<string, number> = {}

  for (const c of cards) {
    const state = c.fsrs_state as number
    if (state === 0) stateCount.new++
    else if (state === 1) stateCount.learning++
    else if (state === 2) stateCount.review++
    else if (state === 3) stateCount.relearning++

    if (c.fsrs_due) {
      if (c.fsrs_due <= nowIso) {
        dueToday++
      } else if (c.fsrs_due <= thirtyDaysLater) {
        const day = c.fsrs_due.slice(0, 10)
        forecastMap[day] = (forecastMap[day] ?? 0) + 1
      }
    } else {
      // New card (no due date) counts as due
      dueToday++
    }
  }

  // Build 30-day forecast array
  const forecast: { date: string; count: number }[] = []
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now.getTime() + i * 86_400_000)
    const dateStr = d.toISOString().slice(0, 10)
    forecast.push({ date: dateStr, count: forecastMap[dateStr] ?? 0 })
  }

  // Retention rate: % of ratings >= 2 over last 30 days
  const totalReviews30d = reviews.length
  const successReviews30d = reviews.filter((r) => (r.rating ?? 1) >= 2).length
  const retentionRate30d = totalReviews30d > 0
    ? Math.round((successReviews30d / totalReviews30d) * 100)
    : null

  // Total all-time reviews
  const { count: totalReviews } = await supabase
    .from('flashcard_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({
    dueToday,
    stateCount,
    totalCards: cards.length,
    retentionRate30d,
    totalReviews: totalReviews ?? 0,
    forecast,
  })
}
