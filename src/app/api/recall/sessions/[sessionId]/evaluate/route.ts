import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { evaluateFreeRecall } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'

const MAX_USER_TEXT = 50_000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient()
  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'recall-evaluate')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  // Quota check
  const now = new Date()
  const resetAt = new Date(profile.generations_reset_at)
  const monthDiff =
    (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth())

  let currentGenerations = profile.generations_used_this_month
  if (monthDiff >= 1) {
    currentGenerations = 0
    await supabaseAdmin.from('profiles').update({
      generations_used_this_month: 0,
      generations_reset_at: now.toISOString(),
    }).eq('id', user.id)
  }

  if (profile.plan === 'free' && currentGenerations >= 5) {
    return NextResponse.json(
      { error: 'Limite mensuelle atteinte. Passez en Pro pour des générations illimitées.' },
      { status: 403 },
    )
  }

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

  const evaluation = await evaluateFreeRecall(session.source_content, userText || '(aucune réponse)')

  await supabase.from('free_recall_sessions').update({
    user_text: userText,
    evaluation,
    score: evaluation.score,
  }).eq('id', sessionId)

  await supabaseAdmin.from('profiles').update({
    generations_used_this_month: currentGenerations + 1,
  }).eq('id', user.id)

  return NextResponse.json({ evaluation })
}
