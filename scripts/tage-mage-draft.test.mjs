import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const moduleUrl = pathToFileURL(new URL('../src/lib/tage-mage/draft.ts', import.meta.url).pathname).href
const { createSubmissionId, parseTageMageDiagnosticDraft } = await import(moduleUrl)
const ids = ['q1', 'q2']
const submissionId = '11111111-1111-4111-8111-111111111111'

test('parseTageMageDiagnosticDraft accepte un brouillon valide', () => {
  const result = parseTageMageDiagnosticDraft(JSON.stringify({
    contentVersion: 1,
    submissionId,
    currentIndex: 1,
    answers: { q1: { selectedIndex: 2, durationSeconds: 12 } },
    totalSeconds: 12,
  }), ids, 1)

  assert.deepEqual(result, {
    contentVersion: 1,
    submissionId,
    currentIndex: 1,
    answers: { q1: { selectedIndex: 2, durationSeconds: 12 } },
    totalSeconds: 12,
  })
})

test('parseTageMageDiagnosticDraft rejette les versions et structures incompatibles', () => {
  assert.equal(parseTageMageDiagnosticDraft('{', ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 2, currentIndex: 0, answers: {}, totalSeconds: 0 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 4, answers: {}, totalSeconds: 0 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 0, answers: null, totalSeconds: 0 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 0, answers: { evil: { selectedIndex: 0, durationSeconds: 1 } }, totalSeconds: 1 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, submissionId: 'invalide', currentIndex: 0, answers: {}, totalSeconds: 0 }), ids, 1), null)
})

test('parseTageMageDiagnosticDraft rejette les réponses et durées hors limites', () => {
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 0, answers: { q1: { selectedIndex: 5, durationSeconds: 1 } }, totalSeconds: 1 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 0, answers: { q1: { selectedIndex: null, durationSeconds: -1 } }, totalSeconds: 0 }), ids, 1), null)
  assert.equal(parseTageMageDiagnosticDraft(JSON.stringify({ contentVersion: 1, currentIndex: 0, answers: {}, totalSeconds: 14_401 }), ids, 1), null)
})

test('createSubmissionId produit un UUID v4 valide même sans crypto.randomUUID (HTTP hors localhost)', () => {
  const original = crypto.randomUUID
  const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  try {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    const first = createSubmissionId()
    assert.match(first, uuidV4)
    assert.notEqual(first, createSubmissionId())
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
  }
  assert.match(createSubmissionId(), uuidV4)
})
