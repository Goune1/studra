import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTimeline } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import {
  consumeGenerationCredit,
  refundGenerationCredit,
  QUOTA_EXCEEDED_ERROR,
} from '@/lib/generation-quota'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'generate-timeline')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const { title, subject, content, language = 'fr', isPublic = false } = body as { title: string; subject: string; content: string; language?: string; isPublic?: boolean }

  if (!title || title.length > 200) return NextResponse.json({ error: 'Titre invalide' }, { status: 400 })
  if (!content || content.length < 50 || content.length > 100000) return NextResponse.json({ error: 'Contenu invalide (50-100000 caractères)' }, { status: 400 })

  // Reserve the credit once the payload is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json({ error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' }, { status: 403 })
  }

  let timelineData
  try {
    timelineData = await generateTimeline(content, language)
    if (!timelineData.events) throw new Error('Format invalide')
  } catch {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la génération de la frise' }, { status: 500 })
  }

  const { data: timeline, error } = await supabase.from('timelines').insert({
    user_id: user.id,
    title,
    subject: subject || null,
    source_content: content,
    generated_data: timelineData,
    is_public: isPublic,
  }).select().single()

  if (error || !timeline) {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ timelineId: timeline.id })
}
