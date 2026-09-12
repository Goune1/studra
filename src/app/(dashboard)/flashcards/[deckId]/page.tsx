import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DeckView, type DeckViewCard, type DeckViewDeck } from './deck-view'

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deck } = await supabase
    .from('decks')
    .select('id, title, subject, created_at')
    .eq('id', deckId)
    .eq('user_id', user!.id)
    .single()
  if (!deck) notFound()

  const { data: cards } = await supabase
    .from('flashcards')
    .select('id, question, answer')
    .eq('deck_id', deckId)
    .order('created_at')

  return <DeckView deck={deck as DeckViewDeck} cards={(cards ?? []) as DeckViewCard[]} />
}
