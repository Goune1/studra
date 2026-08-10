import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlanSchedule, type StudyPlanContentItem } from '@/lib/openai'
import { buildSchedule } from '@/lib/scheduler'
import { adjustMasteryWithFSRS } from '@/lib/study-plan'
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

  const rateLimit = await checkAiRateLimit(user.id, 'generate-study-plan')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const { title, exam_date, available_minutes_per_day, contents } = body as {
    title: string
    exam_date: string
    available_minutes_per_day: number
    contents: StudyPlanContentItem[]
  }

  if (!title || !exam_date || !available_minutes_per_day || !Array.isArray(contents) || contents.length === 0) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  if (new Date(exam_date) <= new Date()) {
    return NextResponse.json({ error: 'La date d\'examen doit être dans le futur' }, { status: 400 })
  }

  // Reserve the credit once the payload is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json(
      { error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' },
      { status: 403 },
    )
  }

  let adjusted: Awaited<ReturnType<typeof adjustMasteryWithFSRS>>
  let llmOutput: Awaited<ReturnType<typeof generateStudyPlanSchedule>>
  try {
    // Pondération FSRS : ajuste la maîtrise auto-évaluée en fonction de la stabilité réelle.
    adjusted = await adjustMasteryWithFSRS(supabase, contents)

    // LLM : priorisation et ordonnancement
    llmOutput = await generateStudyPlanSchedule(adjusted, exam_date, available_minutes_per_day)
  } catch (error) {
    await refundGenerationCredit(user.id)
    throw error
  }

  // Création du plan
  const masteryLevels = Object.fromEntries(adjusted.map((c) => [c.id, c.mastery]))
  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .insert({
      user_id: user.id,
      title,
      exam_date,
      available_minutes_per_day,
      mastery_levels: masteryLevels,
      strategy_notes: llmOutput.strategy_notes,
    })
    .select('id')
    .single()

  if (planError || !plan) {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la création du planning' }, { status: 500 })
  }

  // Construction des sessions
  const tasks = buildSchedule({
    planId: plan.id,
    userId: user.id,
    llmOutput,
    examDate: exam_date,
    availableMinutesPerDay: available_minutes_per_day,
  })

  if (tasks.length > 0) {
    const { error: insertError } = await supabase.from('study_plan_tasks').insert(tasks)
    if (insertError) {
      await supabase.from('study_plans').delete().eq('id', plan.id)
      await refundGenerationCredit(user.id)
      return NextResponse.json({ error: 'Erreur lors de la planification des sessions' }, { status: 500 })
    }
  }

  return NextResponse.json({
    planId: plan.id,
    taskCount: tasks.length,
    strategyNotes: llmOutput.strategy_notes,
  })
}

