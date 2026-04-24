import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StudyPlan } from '@/types'

interface PatchBody {
  title?: string
  exam_date?: string
  available_minutes_per_day?: number
  mastery_levels?: Record<string, number>
  status?: StudyPlan['status']
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { planId } = await params
  const body = (await request.json().catch(() => ({}))) as PatchBody

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.title === 'string' && body.title.trim().length > 0) {
    updates.title = body.title.trim()
  }
  if (typeof body.exam_date === 'string') {
    if (new Date(body.exam_date) <= new Date()) {
      return NextResponse.json(
        { error: 'La date d\'examen doit être dans le futur' },
        { status: 400 },
      )
    }
    updates.exam_date = body.exam_date
  }
  if (typeof body.available_minutes_per_day === 'number' && body.available_minutes_per_day > 0) {
    updates.available_minutes_per_day = Math.min(480, Math.round(body.available_minutes_per_day))
  }
  if (body.mastery_levels && typeof body.mastery_levels === 'object') {
    const cleaned: Record<string, number> = {}
    for (const [k, v] of Object.entries(body.mastery_levels)) {
      if (typeof v === 'number' && v >= 1 && v <= 5) cleaned[k] = Math.round(v)
    }
    updates.mastery_levels = cleaned
  }
  if (body.status && ['active', 'completed', 'abandoned'].includes(body.status)) {
    updates.status = body.status
    if (body.status === 'completed') updates.completed_at = new Date().toISOString()
    else updates.completed_at = null
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('study_plans')
    .update(updates)
    .eq('id', planId)
    .eq('user_id', user.id)
    .select('*')
    .single<StudyPlan>()

  if (error || !data) {
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ plan: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { planId } = await params
  const { error } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
