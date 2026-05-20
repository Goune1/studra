import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { error } = await supabase
    .from('pronote_connections')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Impossible de supprimer la connexion Pronote' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
