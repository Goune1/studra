import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSchema } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import {
  consumeGenerationCredit,
  refundGenerationCredit,
  QUOTA_EXCEEDED_ERROR,
} from '@/lib/generation-quota'
import { resolveContentLanguage, resolveServerLocale } from '@/i18n/server-locale'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'generate-schema')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const { title, subject, content, language, isPublic = false } = body as { title: string; subject: string; content: string; language?: string; isPublic?: boolean }
  const locale = resolveServerLocale(request, {profile})
  const generationLanguage = resolveContentLanguage(language, locale)

  if (!title || title.length > 200) return NextResponse.json({ error: 'Titre invalide' }, { status: 400 })
  if (!content || content.length < 50 || content.length > 100000) return NextResponse.json({ error: 'Contenu invalide (50-100000 caractères)' }, { status: 400 })

  // Reserve the credit once the payload is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json({ error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' }, { status: 403 })
  }

  let schemaData
  try {
    schemaData = await generateSchema(content, generationLanguage)
    if (!schemaData.nodes || !schemaData.edges) throw new Error('Format invalide')
  } catch {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la génération du schéma' }, { status: 500 })
  }

  const { data: schema, error } = await supabase.from('schemas').insert({
    user_id: user.id,
    title,
    subject: subject || null,
    source_content: content,
    generated_data: schemaData,
    is_public: isPublic,
  }).select().single()

  if (error || !schema) {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ schemaId: schema.id })
}
