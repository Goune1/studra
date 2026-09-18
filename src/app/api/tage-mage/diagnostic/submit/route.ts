import { NextResponse } from 'next/server'
import { createTageMageQuestionSnapshot, tageMageDiagnosticQuestionBank } from '@/lib/tage-mage/question-bank.server'
import { scoreDiagnostic } from '@/lib/tage-mage/scoring'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import type { TageMageDiagnosticAnswer } from '@/lib/tage-mage/types'

type JsonObject = Record<string, unknown>

const MAX_DIAGNOSTIC_DURATION_SECONDS = 14_400

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_DIAGNOSTIC_DURATION_SECONDS
}

function isAnswerIndex(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 4)
}

function isSubmissionId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function parseSubmission(value: unknown): { answers: TageMageDiagnosticAnswer[]; submissionId: string } | null {
  if (!isJsonObject(value) || !Array.isArray(value.answers) || !isSubmissionId(value.submissionId)) {
    return null
  }

  if (Object.keys(value).some((key) => key !== 'answers' && key !== 'submissionId')) {
    return null
  }

  const questionIds = new Set(tageMageDiagnosticQuestionBank.map((question) => question.id))
  const seenQuestionIds = new Set<string>()
  const answers: TageMageDiagnosticAnswer[] = []

  for (const valueAnswer of value.answers) {
    if (!isJsonObject(valueAnswer) || Object.keys(valueAnswer).some((key) => key !== 'questionId' && key !== 'selectedIndex' && key !== 'durationSeconds')) {
      return null
    }

    const { questionId, selectedIndex, durationSeconds } = valueAnswer
    if (
      typeof questionId !== 'string' ||
      !questionIds.has(questionId) ||
      seenQuestionIds.has(questionId) ||
      !isAnswerIndex(selectedIndex) ||
      !isDuration(durationSeconds)
    ) {
      return null
    }

    seenQuestionIds.add(questionId)
    answers.push({ questionId, selectedIndex, durationSeconds })
  }

  const answerDurationSeconds = answers.reduce((total, answer) => total + answer.durationSeconds, 0)
  if (answerDurationSeconds > MAX_DIAGNOSTIC_DURATION_SECONDS) return null

  return seenQuestionIds.size === questionIds.size ? { answers, submissionId: value.submissionId } : null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const withinRateLimit = await checkRateLimit(user.id, 'tage-mage-diagnostic-submit', 20, 3600)
  if (!withinRateLimit) return NextResponse.json({ error: 'Trop de tentatives. Réessaie plus tard.' }, { status: 429 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('JSON invalide')
  }

  const submission = parseSubmission(body)
  if (!submission) return badRequest('Soumission invalide')

  const contentVersions = new Set(tageMageDiagnosticQuestionBank.map((question) => question.contentVersion))
  if (contentVersions.size !== 1) {
    return NextResponse.json({ error: 'Version de contenu invalide' }, { status: 500 })
  }

  const score = scoreDiagnostic(tageMageDiagnosticQuestionBank, submission.answers)
  const admin = getSupabaseAdmin()
  const { data: attempt, error } = await admin
    .from('tage_mage_diagnostic_attempts')
    .insert({
      user_id: user.id,
      submission_id: submission.submissionId,
      content_version: tageMageDiagnosticQuestionBank[0].contentVersion,
      question_snapshot: createTageMageQuestionSnapshot(),
      answers: submission.answers,
      section_results: score.sectionResults,
      correct_count: score.correctCount,
      total_questions: score.totalQuestions,
      duration_seconds: score.durationSeconds,
    })
    .select('id')
    .single()

  if (error?.code === '23505') {
    const { data: existingAttempt } = await admin
      .from('tage_mage_diagnostic_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('submission_id', submission.submissionId)
      .maybeSingle()
    if (existingAttempt) return NextResponse.json({ attemptId: existingAttempt.id })
  }

  if (error || !attempt) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id })
}
