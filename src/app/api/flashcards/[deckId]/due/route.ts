import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDueCards } from '@/lib/fsrs/service'

export async function GET(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)

  const { cards, totalInDeck } = await getDueCards(deckId, user.id, limit, supabase)

  // Find next due date for cards not yet due
  const { data: nextDueRow } = await supabase
    .from('flashcards')
    .select('fsrs_due')
    .eq('deck_id', deckId)
    .not('fsrs_due', 'is', null)
    .gt('fsrs_due', new Date().toISOString())
    .order('fsrs_due', { ascending: true })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    cards,
    totalInDeck,
    dueCount: cards.length,
    nextDueAt: nextDueRow?.fsrs_due ?? null,
  })
}
