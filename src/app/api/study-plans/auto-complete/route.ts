import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Marque comme "completed" les sessions pending/in_progress du jour
 * dont le premier contenu correspond à celui que l'utilisateur vient
 * de terminer (flashcards/review/general_review sur ce deck, ou fiche).
 *
 * Appelée automatiquement à la fin d'une review de deck / consultation de fiche.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    content_id?: string
    content_type?: 'deck' | 'fiche'
  }

  if (!body.content_id || !body.content_type) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { data: sessions } = await supabase
    .from('study_plan_tasks')
    .select('id, content_refs, task_type')
    .eq('user_id', user.id)
    .eq('scheduled_date', today)
    .not('status', 'in', '(completed,skipped)')

  if (!sessions || sessions.length === 0) return NextResponse.json({ completed: 0 })

  const matching: string[] = []
  for (const s of sessions as Array<{
    id: string
    content_refs: Array<{ id: string; type: string }> | null
    task_type: string
  }>) {
    const primary = s.content_refs?.[0]
    if (!primary) continue
    if (primary.id !== body.content_id) continue
    if (primary.type !== body.content_type) continue
    // Filtrer selon le task_type pour éviter de compléter une "fiche" quand
    // l'utilisateur termine un deck, par exemple.
    if (body.content_type === 'deck' && !['flashcards', 'review', 'general_review'].includes(s.task_type)) continue
    if (body.content_type === 'fiche' && !['fiche', 'review', 'general_review'].includes(s.task_type)) continue
    matching.push(s.id)
  }

  if (matching.length === 0) return NextResponse.json({ completed: 0 })

  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from('study_plan_tasks')
    .update({ status: 'completed', completed_at: nowIso, updated_at: nowIso })
    .in('id', matching)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  return NextResponse.json({ completed: matching.length })
}
