import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlanSchedule, type StudyPlanContentItem } from '@/lib/openai'
import { buildSchedule } from '@/lib/scheduler'
import { adjustMasteryWithFSRS } from '@/lib/study-plan'
import { checkRateLimit } from '@/lib/rate-limit'

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

  // Pondération FSRS : ajuste la maîtrise auto-évaluée en fonction de la stabilité réelle.
  const adjusted = await adjustMasteryWithFSRS(supabase, contents)

  // LLM : priorisation et ordonnancement
  const llmOutput = await generateStudyPlanSchedule(adjusted, exam_date, available_minutes_per_day)

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
      return NextResponse.json({ error: 'Erreur lors de la planification des sessions' }, { status: 500 })
    }
  }

  await supabase.from('profiles').update({
    generations_used_this_month: currentGenerations + 1,
  }).eq('id', user.id)

  return NextResponse.json({
    planId: plan.id,
    taskCount: tasks.length,
    strategyNotes: llmOutput.strategy_notes,
  })
}

