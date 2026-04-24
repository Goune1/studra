import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { socrateResponse } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_SOURCE = 100_000
const MAX_TITLE = 200

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'generate', 30, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de générations. Réessayez dans une heure.' },
      { status: 429 },
    )
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
    await supabase.from('profiles').update({
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

  const firstMessage = await socrateResponse(source_content, [])

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
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }

  await supabase.from('profiles').update({
    generations_used_this_month: currentGenerations + 1,
  }).eq('id', user.id)

  return NextResponse.json({ sessionId: session.id, firstMessage })
}
