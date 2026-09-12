import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageClient, { type DeckSummary } from './page-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('decks')
    .select('id, title, subject, card_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PageClient initialDecks={(data ?? []) as DeckSummary[]} userId={user.id} />
}
