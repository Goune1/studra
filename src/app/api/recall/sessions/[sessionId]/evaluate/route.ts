import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateFreeRecall } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import {
  consumeGenerationCredit,
  refundGenerationCredit,
  QUOTA_EXCEEDED_ERROR,
} from '@/lib/generation-quota'

const MAX_USER_TEXT = 50_000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'recall-evaluate')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { sessionId } = await params
  const body = await request.json()
  const { userText } = body as { userText: string }

  if (typeof userText !== 'string') {
    return NextResponse.json({ error: 'Texte manquant' }, { status: 400 })
  }
  if (userText.length > MAX_USER_TEXT) {
    return NextResponse.json(
      { error: `Texte trop long (max ${MAX_USER_TEXT} caractères).` },
      { status: 400 },
    )
  }

  const { data: session } = await supabase
    .from('free_recall_sessions')
    .select('source_content')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  // Reserve the credit once the request is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json(
      { error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' },
      { status: 403 },
    )
  }

  let evaluation: Awaited<ReturnType<typeof evaluateFreeRecall>>
  try {
    evaluation = await evaluateFreeRecall(session.source_content, userText || '(aucune réponse)')
  } catch (error) {
    await refundGenerationCredit(user.id)
    throw error
  }

  await supabase.from('free_recall_sessions').update({
    user_text: userText,
    evaluation,
    score: evaluation.score,
  }).eq('id', sessionId)

  return NextResponse.json({ evaluation })
}
