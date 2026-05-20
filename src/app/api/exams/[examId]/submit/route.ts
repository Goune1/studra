import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateOpenAnswer } from '@/lib/openai'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import type { ExamQuestion, ExamQuestionMCQ, ExamQuestionOpen, ExamAnswer } from '@/types'

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'exam-submit')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .eq('user_id', user.id)
    .single()

  if (!exam) return NextResponse.json({ error: 'Examen introuvable' }, { status: 404 })

  const body = await request.json()
  const { userAnswers } = body as { userAnswers: Record<string, string> }

  const questions = exam.questions as ExamQuestion[]
  const answers: ExamAnswer[] = []
  let totalScore = 0

  for (const question of questions) {
    const userAnswer = userAnswers[question.id] ?? ''

    if (question.type === 'mcq') {
      const mcq = question as ExamQuestionMCQ
      const selectedIndex = parseInt(userAnswer, 10)
      const isCorrect = selectedIndex === mcq.correct_index
      answers.push({
        question_id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect ? 'Bonne réponse !' : `La bonne réponse était : ${mcq.options[mcq.correct_index]}. ${mcq.explanation}`,
      })
      if (isCorrect) totalScore++
    } else {
      const open = question as ExamQuestionOpen
      if (!userAnswer.trim()) {
        answers.push({
          question_id: question.id,
          user_answer: '',
          is_correct: false,
          score: 0,
          feedback: 'Aucune réponse fournie.',
        })
      } else {
        const evaluation = await evaluateOpenAnswer(open.question, open.model_answer, open.keywords, userAnswer)
        const isCorrect = evaluation.score >= 0.6
        answers.push({
          question_id: question.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          score: evaluation.score,
          feedback: evaluation.feedback,
        })
        totalScore += evaluation.score
      }
    }
  }

  const scorePercent = Math.round((totalScore / questions.length) * 100)

  const { data: session, error } = await supabase.from('exam_sessions').insert({
    exam_id: examId,
    user_id: user.id,
    answers,
    score: scorePercent,
    total_questions: questions.length,
  }).select().single()

  if (error || !session) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  return NextResponse.json({ sessionId: session.id, score: scorePercent, answers })
}
