import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeLacunes } from '@/lib/openai'
import type { LacuneCard } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Aggregate reviews per flashcard
  const { data: reviews } = await supabase
    .from('flashcard_reviews')
    .select('flashcard_id, knew')
    .eq('user_id', user.id)

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ lacunes: [], analysis: '', totalReviews: 0 })
  }

  // Group by flashcard_id
  const stats: Record<string, { wrong: number; total: number }> = {}
  for (const r of reviews) {
    if (!stats[r.flashcard_id]) stats[r.flashcard_id] = { wrong: 0, total: 0 }
    stats[r.flashcard_id].total++
    if (!r.knew) stats[r.flashcard_id].wrong++
  }

  // Keep only cards with wrong_rate >= 0.5 and at least 2 reviews
  const weakIds = Object.entries(stats)
    .filter(([, s]) => s.total >= 2 && s.wrong / s.total >= 0.5)
    .sort(([, a], [, b]) => b.wrong / b.total - a.wrong / a.total)
    .slice(0, 20)
    .map(([id]) => id)

  if (weakIds.length === 0) {
    return NextResponse.json({ lacunes: [], analysis: '', totalReviews: reviews.length })
  }

  // Fetch the flashcard data
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('id, question, answer')
    .in('id', weakIds)

  if (!flashcards) return NextResponse.json({ lacunes: [], analysis: '', totalReviews: reviews.length })

  const lacunes: LacuneCard[] = flashcards.map((f) => ({
    flashcard_id: f.id,
    question: f.question,
    answer: f.answer,
    wrong_count: stats[f.id].wrong,
    total_count: stats[f.id].total,
    wrong_rate: stats[f.id].wrong / stats[f.id].total,
  }))

  const totalCorrect = reviews.filter((r) => r.knew).length
  const successRate = Math.round((totalCorrect / reviews.length) * 100)

  const analysis = await analyzeLacunes(lacunes)

  return NextResponse.json({
    lacunes,
    analysis,
    stats: {
      sessions: reviews.length,
      weakPoints: lacunes.length,
      successRate,
    },
  })
}
