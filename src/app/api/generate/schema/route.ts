import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { generateSchema } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'generate-schema')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const now = new Date()
  const resetAt = new Date(profile.generations_reset_at)
  const monthDiff = (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth())
  let currentGenerations = profile.generations_used_this_month

  if (monthDiff >= 1) {
    currentGenerations = 0
    await supabaseAdmin.from('profiles').update({ generations_used_this_month: 0, generations_reset_at: now.toISOString() }).eq('id', user.id)
  }

  if (profile.plan === 'free' && currentGenerations >= 5) {
    return NextResponse.json({ error: 'Limite mensuelle atteinte. Passez en Pro pour des générations illimitées.' }, { status: 403 })
  }

  const body = await request.json()
  const { title, subject, content, language = 'fr', isPublic = false } = body as { title: string; subject: string; content: string; language?: string; isPublic?: boolean }

  if (!title || title.length > 200) return NextResponse.json({ error: 'Titre invalide' }, { status: 400 })
  if (!content || content.length < 50 || content.length > 100000) return NextResponse.json({ error: 'Contenu invalide (50-100000 caractères)' }, { status: 400 })

  let schemaData
  try {
    schemaData = await generateSchema(content, language)
    if (!schemaData.nodes || !schemaData.edges) throw new Error('Format invalide')
  } catch {
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

  if (error || !schema) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  await supabaseAdmin.from('profiles').update({ generations_used_this_month: currentGenerations + 1 }).eq('id', user.id)

  return NextResponse.json({ schemaId: schema.id })
}
