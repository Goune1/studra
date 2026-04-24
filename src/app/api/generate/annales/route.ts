import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeExamStyle, generateFromTemplate } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_EXAM = 100_000
const MAX_COURSE = 100_000
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
  const rawExam = (body as { exam_text?: unknown }).exam_text
  const rawCourse = (body as { course_content?: unknown }).course_content
  const rawTitle = (body as { title?: unknown }).title

  const exam_text = typeof rawExam === 'string' ? rawExam : ''
  const course_content = typeof rawCourse === 'string' ? rawCourse : ''
  const title = typeof rawTitle === 'string' ? rawTitle.trim().slice(0, MAX_TITLE) : ''

  if (!exam_text || exam_text.length < 100) {
    return NextResponse.json({ error: 'Annale trop courte (minimum 100 caractères)' }, { status: 400 })
  }
  if (exam_text.length > MAX_EXAM) {
    return NextResponse.json({ error: `Annale trop longue (max ${MAX_EXAM} caractères).` }, { status: 400 })
  }
  if (!course_content || course_content.length < 50) {
    return NextResponse.json({ error: 'Contenu de cours insuffisant' }, { status: 400 })
  }
  if (course_content.length > MAX_COURSE) {
    return NextResponse.json({ error: `Cours trop long (max ${MAX_COURSE} caractères).` }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ error: 'Titre manquant' }, { status: 400 })
  }

  // Step 1: analyze style
  const detectedStyle = await analyzeExamStyle(exam_text)

  // Save template
  const { data: template } = await supabase
    .from('exam_templates')
    .insert({ user_id: user.id, source_text: exam_text, detected_style: detectedStyle })
    .select('id')
    .single()

  // Step 2: generate new exam from style + course content
  const { questions, answers } = await generateFromTemplate(detectedStyle, course_content, title)

  const { data: generatedExam, error } = await supabase
    .from('generated_past_exams')
    .insert({
      template_id: template?.id ?? null,
      user_id: user.id,
      title,
      source_content: course_content,
      questions_json: questions,
      answers_json: answers,
    })
    .select('id')
    .single()

  if (error || !generatedExam) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  await supabase.from('profiles').update({
    generations_used_this_month: currentGenerations + 1,
  }).eq('id', user.id)

  return NextResponse.json({ examId: generatedExam.id })
}
