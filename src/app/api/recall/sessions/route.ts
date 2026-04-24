import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { content_title, source_content, duration_seconds } = body as {
    content_title: string
    source_content: string
    duration_seconds: number
  }

  if (!content_title || !source_content || source_content.length < 50) {
    return NextResponse.json({ error: 'Contenu insuffisant' }, { status: 400 })
  }
  if (!duration_seconds || duration_seconds < 60) {
    return NextResponse.json({ error: 'Durée invalide' }, { status: 400 })
  }

  const { data: session, error } = await supabase
    .from('free_recall_sessions')
    .insert({
      user_id: user.id,
      content_title,
      source_content,
      duration_seconds,
    })
    .select('id')
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id })
}
