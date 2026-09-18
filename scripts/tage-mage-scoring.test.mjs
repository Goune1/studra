import test from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const scoringUrl = pathToFileURL(new URL('../src/lib/tage-mage/scoring.ts', import.meta.url).pathname).href
const typesUrl = pathToFileURL(new URL('../src/lib/tage-mage/types.ts', import.meta.url).pathname).href

const { scoreDiagnostic } = await import(scoringUrl)
const { TAGE_MAGE_SECTIONS } = await import(typesUrl)

const questions = [
  { id: 'comp-1', section: 'comprehension', correctIndex: 2 },
  { id: 'calc-1', section: 'calcul', correctIndex: 0 },
  { id: 'calc-2', section: 'calcul', correctIndex: 4 },
]

test('scoreDiagnostic calcule les résultats par section sans score sur 600', () => {
  const result = scoreDiagnostic(questions, [
    { questionId: 'comp-1', selectedIndex: 2, durationSeconds: 30 },
    { questionId: 'calc-1', selectedIndex: 1, durationSeconds: 10 },
    { questionId: 'calc-2', selectedIndex: 4, durationSeconds: 20 },
  ])

  assert.equal(result.correctCount, 2)
  assert.equal(result.totalQuestions, 3)
  assert.equal(result.durationSeconds, 60)
  assert.deepEqual(result.sectionResults, {
    comprehension: { correctCount: 1, totalQuestions: 1, accuracy: 100, averageDurationSeconds: 30 },
    calcul: { correctCount: 1, totalQuestions: 2, accuracy: 50, averageDurationSeconds: 15 },
  })
  assert.equal('score600' in result, false)
})

test('scoreDiagnostic compte une réponse absente comme fausse et conserve le temps nul', () => {
  const result = scoreDiagnostic(questions, [
    { questionId: 'comp-1', selectedIndex: null, durationSeconds: 0 },
  ])

  assert.equal(result.correctCount, 0)
  assert.equal(result.durationSeconds, 0)
  assert.deepEqual(result.sectionResults.comprehension, {
    correctCount: 0,
    totalQuestions: 1,
    accuracy: 0,
    averageDurationSeconds: 0,
  })
  assert.deepEqual(result.sectionResults.calcul, {
    correctCount: 0,
    totalQuestions: 2,
    accuracy: 0,
    averageDurationSeconds: 0,
  })
})

test('scoreDiagnostic inclut les six sections avec une section incomplète', () => {
  const result = scoreDiagnostic([
    { id: 'logic-1', section: 'logique', correctIndex: 3 },
  ], [])

  assert.deepEqual(Object.keys(result.sectionResults), ['logique'])
  assert.deepEqual(result.sectionResults.logique, {
    correctCount: 0,
    totalQuestions: 1,
    accuracy: 0,
    averageDurationSeconds: 0,
  })
  assert.equal(TAGE_MAGE_SECTIONS.length, 6)
})
