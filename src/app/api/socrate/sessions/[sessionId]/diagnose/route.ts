import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { socrateDiagnosis } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import type { SocrateMessage } from '@/types'

const MAX_USER_TEXT = 50_000

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'socrate-diagnose')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { sessionId } = await params

  const { data: session } = await supabase
    .from('feynman_sessions')
    .select('source_content, messages')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  const history = session.messages as SocrateMessage[]
  const userTextLength = history
    .filter((message) => message.role === 'user')
    .reduce((total, message) => total + message.content.length, 0)

  if (userTextLength > MAX_USER_TEXT) {
    return NextResponse.json(
      { error: `Texte utilisateur trop long (max ${MAX_USER_TEXT} caractères).` },
      { status: 400 },
    )
  }

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
