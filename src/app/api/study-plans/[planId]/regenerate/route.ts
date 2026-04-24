import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlanSchedule } from '@/lib/openai'
import { buildSchedule } from '@/lib/scheduler'
import { adjustMasteryWithFSRS, resolvePlanContents } from '@/lib/study-plan'
import type { StudyPlan } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { planId } = await params

  const { data: plan } = await supabase
    .from('study_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single<StudyPlan>()

  if (!plan) return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 })
  if (new Date(plan.exam_date) <= new Date()) {
    return NextResponse.json(
      { error: 'La date d\'examen est passée. Crée un nouveau plan.' },
      { status: 400 },
    )
  }

  // Reconstruit la liste des contenus à partir des mastery_levels persistés.
  const contents = await resolvePlanContents(supabase, user.id, plan.mastery_levels ?? {})
  if (contents.length === 0) {
    return NextResponse.json(
      { error: 'Aucun contenu associé. Ajoute des contenus avant de régénérer.' },
      { status: 400 },
    )
  }

  const adjusted = await adjustMasteryWithFSRS(supabase, contents)
  const llmOutput = await generateStudyPlanSchedule(
    adjusted,
    plan.exam_date,
    plan.available_minutes_per_day,
  )

  // Purge les sessions existantes
  await supabase
    .from('study_plan_tasks')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', user.id)

  const tasks = buildSchedule({
    planId,
    userId: user.id,
    llmOutput,
    examDate: plan.exam_date,
    availableMinutesPerDay: plan.available_minutes_per_day,
  })
  if (tasks.length > 0) {
    const { error: insertError } = await supabase.from('study_plan_tasks').insert(tasks)
    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la planification' }, { status: 500 })
    }
  }

  const masteryLevels = Object.fromEntries(adjusted.map((c) => [c.id, c.mastery]))
  await supabase
    .from('study_plans')
    .update({
      strategy_notes: llmOutput.strategy_notes,
      mastery_levels: masteryLevels,
      status: 'active',
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', user.id)

  return NextResponse.json({
    ok: true,
    taskCount: tasks.length,
    strategyNotes: llmOutput.strategy_notes,
  })
}
