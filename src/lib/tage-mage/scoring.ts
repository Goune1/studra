import type {
  TageMageDiagnosticAnswer,
  TageMageDiagnosticQuestion,
  TageMageDiagnosticScore,
  TageMageSection,
  TageMageSectionResult,
} from './types'

export function scoreDiagnostic(
  questions: Pick<TageMageDiagnosticQuestion, 'id' | 'section' | 'correctIndex'>[],
  answers: TageMageDiagnosticAnswer[],
): TageMageDiagnosticScore {
  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]))
  const sectionResults: Partial<Record<TageMageSection, TageMageSectionResult>> = {}
  let correctCount = 0
  let durationSeconds = 0

  for (const question of questions) {
    const answer = answersByQuestionId.get(question.id)
    const answerDuration = answer?.durationSeconds ?? 0
    const isCorrect = answer?.selectedIndex === question.correctIndex
    const section = sectionResults[question.section] ?? {
      correctCount: 0,
      totalQuestions: 0,
      accuracy: 0,
      averageDurationSeconds: 0,
    }

    section.totalQuestions += 1
    section.correctCount += Number(isCorrect)
    section.averageDurationSeconds += answerDuration
    sectionResults[question.section] = section
    correctCount += Number(isCorrect)
    durationSeconds += answerDuration
  }

  for (const section of Object.values(sectionResults)) {
    section.accuracy = Math.round((section.correctCount / section.totalQuestions) * 100)
    section.averageDurationSeconds = Math.round(section.averageDurationSeconds / section.totalQuestions)
  }

  return {
    correctCount,
    totalQuestions: questions.length,
    durationSeconds,
    sectionResults,
  }
}
