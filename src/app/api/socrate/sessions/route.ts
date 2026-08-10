import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { socrateResponse } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import {
  consumeGenerationCredit,
  refundGenerationCredit,
  QUOTA_EXCEEDED_ERROR,
} from '@/lib/generation-quota'

const MAX_SOURCE = 100_000
const MAX_TITLE = 200

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'socrate-session')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const rawTitle = (body as { content_title?: unknown }).content_title
  const rawSource = (body as { source_content?: unknown }).source_content

  const content_title = typeof rawTitle === 'string' ? rawTitle.trim().slice(0, MAX_TITLE) : ''
  const source_content = typeof rawSource === 'string' ? rawSource : ''

  if (!content_title || !source_content || source_content.length < 50) {
    return NextResponse.json({ error: 'Contenu insuffisant' }, { status: 400 })
  }
  if (source_content.length > MAX_SOURCE) {
    return NextResponse.json(
      { error: `Contenu trop long (max ${MAX_SOURCE} caractères).` },
      { status: 400 },
    )
  }

  // Reserve the credit once the payload is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json(
      { error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' },
      { status: 403 },
    )
  }

  let firstMessage: Awaited<ReturnType<typeof socrateResponse>>
  try {
    firstMessage = await socrateResponse(source_content, [])
  } catch (error) {
    await refundGenerationCredit(user.id)
    throw error
  }

  const { data: session, error } = await supabase
    .from('feynman_sessions')
    .insert({
      user_id: user.id,
      content_title,
      source_content,
      messages: [{ role: 'assistant', content: firstMessage }],
    })
    .select('id')
    .single()

  if (error || !session) {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, firstMessage })
}
