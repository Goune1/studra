export const MAX_DIAGNOSTIC_DURATION_SECONDS = 14_400

export type TageMageDraftAnswer = {
  selectedIndex: number | null
  durationSeconds: number
}

export type TageMageDiagnosticDraft = {
  contentVersion: number
  submissionId: string
  currentIndex: number
  answers: Record<string, TageMageDraftAnswer>
  totalSeconds: number
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDuration(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= MAX_DIAGNOSTIC_DURATION_SECONDS
}

function isSelectedIndex(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 4)
}

function isSubmissionId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function parseTageMageDiagnosticDraft(
  raw: string,
  questionIds: readonly string[],
  contentVersion: number,
): TageMageDiagnosticDraft | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isObject(value) || value.contentVersion !== contentVersion) return null
  if (!isSubmissionId(value.submissionId)) return null
  if (!Number.isSafeInteger(value.currentIndex) || Number(value.currentIndex) < 0 || Number(value.currentIndex) >= questionIds.length) return null
  if (!isDuration(value.totalSeconds) || !isObject(value.answers)) return null

  const validIds = new Set(questionIds)
  const answers: Record<string, TageMageDraftAnswer> = {}
  let answerDurationSeconds = 0

  for (const [questionId, answer] of Object.entries(value.answers)) {
    if (!validIds.has(questionId) || !isObject(answer)) return null
    if (!isSelectedIndex(answer.selectedIndex) || !isDuration(answer.durationSeconds)) return null
    answers[questionId] = {
      selectedIndex: answer.selectedIndex,
      durationSeconds: answer.durationSeconds,
    }
    answerDurationSeconds += answer.durationSeconds
  }

  if (answerDurationSeconds > MAX_DIAGNOSTIC_DURATION_SECONDS) return null

  return {
    contentVersion,
    submissionId: value.submissionId,
    currentIndex: Number(value.currentIndex),
    answers,
    totalSeconds: value.totalSeconds,
  }
}
