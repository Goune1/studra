import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { explainDifferently } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_FIELD = 4000

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'explain', 60, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  const body = await request.json()
  const question = typeof (body as { question?: unknown }).question === 'string' ? (body as { question: string }).question : ''
  const answer = typeof (body as { answer?: unknown }).answer === 'string' ? (body as { answer: string }).answer : ''
  const style = (body as { style?: unknown }).style as 'analogy' | 'example' | 'simple' | 'stepbystep' | undefined

  if (!question || !answer || !style) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  if (!['analogy', 'example', 'simple', 'stepbystep'].includes(style)) {
    return NextResponse.json({ error: 'Style invalide' }, { status: 400 })
  }
  if (question.length > MAX_FIELD || answer.length > MAX_FIELD) {
    return NextResponse.json({ error: 'Contenu trop long' }, { status: 400 })
  }

  const explanation = await explainDifferently(question, answer, style)
  return NextResponse.json({ explanation })
}
