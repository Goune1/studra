import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageClient, { type InitialPlanningItem } from './page-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: fiches }, { data: decks }] = await Promise.all([
    supabase.from('fiches').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('decks').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const items: InitialPlanningItem[] = [
    ...(fiches ?? []).map((fiche) => ({ id: fiche.id, title: fiche.title, type: 'fiche' as const })),
    ...(decks ?? []).map((deck) => ({ id: deck.id, title: deck.title, type: 'deck' as const })),
  ]

  return <PageClient initialItems={items} />
}
