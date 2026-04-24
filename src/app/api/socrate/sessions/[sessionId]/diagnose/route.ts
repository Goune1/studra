import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { socrateDiagnosis } from '@/lib/openai'
import type { SocrateMessage } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { sessionId } = await params

  const { data: session } = await supabase
    .from('feynman_sessions')
    .select('source_content, messages')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  const history = session.messages as SocrateMessage[]

  if (history.length < 4) {
    return NextResponse.json(
      { error: 'La session est trop courte pour générer un diagnostic (minimum 2 échanges).' },
      { status: 400 },
    )
  }

  const diagnosis = await socrateDiagnosis(session.source_content, history)

  await supabase
    .from('feynman_sessions')
    .update({ diagnosis })
    .eq('id', sessionId)

  return NextResponse.json({ diagnosis })
}
