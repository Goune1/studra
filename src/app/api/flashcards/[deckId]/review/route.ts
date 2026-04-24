import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scheduleReview } from '@/lib/fsrs/service'
import type { FsrsRating } from '@/lib/fsrs/types'
import type { Flashcard } from '@/types'

export async function POST(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { flashcard_id, rating, duration_ms } = body as {
    flashcard_id: string
    rating: number
    duration_ms?: number
  }

  if (!flashcard_id) {
    return NextResponse.json({ error: 'flashcard_id requis' }, { status: 400 })
  }
  if (![1, 2, 3, 4].includes(rating)) {
    return NextResponse.json({ error: 'rating doit être 1, 2, 3 ou 4' }, { status: 400 })
  }

  // Fetch the flashcard (RLS ensures it belongs to the user's deck)
  const { data: flashcard, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', flashcard_id)
    .eq('deck_id', deckId)
    .single()

  if (error || !flashcard) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  const nextIntervals = await scheduleReview(
    flashcard as Flashcard,
    deckId,
    user.id,
    rating as FsrsRating,
    duration_ms,
    supabase,
  )

  return NextResponse.json({ ok: true, nextIntervals })
}
