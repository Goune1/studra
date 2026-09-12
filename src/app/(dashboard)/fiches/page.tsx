import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageClient, { type FicheSummary } from './page-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('fiches')
    .select('id, title, subject, generated_content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PageClient initialFiches={(data ?? []) as FicheSummary[]} userId={user.id} />
}
