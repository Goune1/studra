import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StudyPlan, StudyPlanTask } from '@/types'

type Action = 'start' | 'complete' | 'postpone' | 'skip' | 'reset'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string; sessionId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { planId, sessionId } = await params
  const body = (await request.json().catch(() => ({}))) as { action?: Action }
  const action = body.action
  if (!action) return NextResponse.json({ error: 'Action manquante' }, { status: 400 })

  const { data: session } = await supabase
    .from('study_plan_tasks')
    .select('*')
    .eq('id', sessionId)
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .single<StudyPlanTask>()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  const nowIso = new Date().toISOString()
  let updates: Partial<StudyPlanTask> = { updated_at: nowIso }

  switch (action) {
    case 'start':
      updates = {
        ...updates,
        status: 'in_progress',
        started_at: session.started_at ?? nowIso,
      }
      break

    case 'complete':
      updates = {
        ...updates,
        status: 'completed',
        completed_at: nowIso,
        started_at: session.started_at ?? nowIso,
      }
      break

    case 'reset':
      updates = {
        ...updates,
        status: 'pending',
        completed_at: null,
        started_at: null,
      }
      break

    case 'skip':
      updates = {
        ...updates,
        status: 'skipped',
      }
      break

    case 'postpone': {
      // Décale d'un jour, recompacte dans la limite des jours restants avant l'examen.
      const { data: plan } = await supabase
        .from('study_plans')
        .select('exam_date')
        .eq('id', planId)
        .single<Pick<StudyPlan, 'exam_date'>>()
      if (!plan) return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 })
      const next = addDays(session.scheduled_date, 1)
      if (next > plan.exam_date) {
        return NextResponse.json(
          { error: 'Impossible de reporter au-delà de la date d\'examen' },
          { status: 400 },
        )
      }
      updates = {
        ...updates,
        scheduled_date: next,
        status: 'postponed',
      }
      break
    }

    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('study_plan_tasks')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('*')
    .single<StudyPlanTask>()

  if (error || !updated) {
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
  }

  // Si toutes les sessions du plan sont terminées → plan.status = completed
  if (updates.status === 'completed') {
    await maybeMarkPlanCompleted(supabase, planId, user.id)
  } else if (updates.status === 'pending' || updates.status === 'in_progress') {
    await unmarkPlanCompleted(supabase, planId, user.id)
  }

  return NextResponse.json({ session: updated })
}

async function maybeMarkPlanCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  userId: string,
) {
  const { count: openCount } = await supabase
    .from('study_plan_tasks')
    .select('*', { head: true, count: 'exact' })
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .not('status', 'in', '(completed,skipped)')
  if ((openCount ?? 0) === 0) {
    await supabase
      .from('study_plans')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', userId)
  }
}

async function unmarkPlanCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  userId: string,
) {
  await supabase
    .from('study_plans')
    .update({ status: 'active', completed_at: null, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', userId)
    .eq('status', 'completed')
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
