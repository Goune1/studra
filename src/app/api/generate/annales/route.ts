import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeExamStyle, generateFromTemplate } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import {
  consumeGenerationCredit,
  refundGenerationCredit,
  QUOTA_EXCEEDED_ERROR,
} from '@/lib/generation-quota'

const MAX_EXAM = 100_000
const MAX_COURSE = 100_000
const MAX_TITLE = 200

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'generate-annales')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

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

  // Reserve the credit once the payload is known to be valid, so that a
  // rejected request never consumes a generation.
  const credit = await consumeGenerationCredit(user.id)
  if (!credit.allowed) {
    return NextResponse.json(
      { error: QUOTA_EXCEEDED_ERROR, code: 'quota_exceeded' },
      { status: 403 },
    )
  }

  let questions: Awaited<ReturnType<typeof generateFromTemplate>>['questions']
  let answers: Awaited<ReturnType<typeof generateFromTemplate>>['answers']
  let templateId: string | null = null
  try {
    // Step 1: analyze style
    const detectedStyle = await analyzeExamStyle(exam_text)

    // Save template
    const { data: template } = await supabase
      .from('exam_templates')
      .insert({ user_id: user.id, source_text: exam_text, detected_style: detectedStyle })
      .select('id')
      .single()
    templateId = template?.id ?? null

    // Step 2: generate new exam from style + course content
    const generated = await generateFromTemplate(detectedStyle, course_content, title)
    questions = generated.questions
    answers = generated.answers
  } catch (error) {
    await refundGenerationCredit(user.id)
    throw error
  }

  const { data: generatedExam, error } = await supabase
    .from('generated_past_exams')
    .insert({
      template_id: templateId,
      user_id: user.id,
      title,
      source_content: course_content,
      questions_json: questions,
      answers_json: answers,
    })
    .select('id')
    .single()

  if (error || !generatedExam) {
    await refundGenerationCredit(user.id)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ examId: generatedExam.id })
}
