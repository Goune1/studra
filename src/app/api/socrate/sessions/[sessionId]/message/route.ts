import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { socrateResponse } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import type { SocrateMessage } from '@/types'

const MAX_USER_MESSAGE = 2000
const MAX_HISTORY = 20

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'socrate-message')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { sessionId } = await params
  const body = await request.json()
  const rawMessage = (body as { userMessage?: unknown }).userMessage
  const userMessage = typeof rawMessage === 'string' ? rawMessage.trim() : ''

  if (!userMessage) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  }
  if (userMessage.length > MAX_USER_MESSAGE) {
    return NextResponse.json(
      { error: `Message trop long (max ${MAX_USER_MESSAGE} caractères).` },
      { status: 400 },
    )
  }

  const { data: session } = await supabase
    .from('feynman_sessions')
    .select('source_content, messages')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  const history = session.messages as SocrateMessage[]
  const updatedHistory: SocrateMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  // Cap envoyé au LLM pour borner coûts et latence.
  const promptHistory = updatedHistory.slice(-MAX_HISTORY)
  const assistantMessage = await socrateResponse(session.source_content, promptHistory)

  const finalHistory: SocrateMessage[] = [
    ...updatedHistory,
    { role: 'assistant', content: assistantMessage },
  ]

  await supabase
    .from('feynman_sessions')
    .update({ messages: finalHistory })
    .eq('id', sessionId)

  return NextResponse.json({ message: assistantMessage })
}
