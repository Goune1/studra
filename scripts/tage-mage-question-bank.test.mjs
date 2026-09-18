import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createRequire } from 'node:module'
import ts from 'typescript'

const bankPath = new URL('../src/lib/tage-mage/question-bank.server.ts', import.meta.url)
const expectedSections = [
  'comprehension',
  'calcul',
  'conditions_minimales',
  'expression',
  'raisonnement_argumentation',
  'logique',
]

function loadQuestionBank() {
  assert.ok(existsSync(bankPath), 'la banque de questions serveur doit exister')

  const source = readFileSync(bankPath, 'utf8')
  assert.match(source, /import\s+['"]server-only['"]/, 'le module doit être explicitement server-only')

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const directory = mkdtempSync(join(tmpdir(), 'tage-mage-question-bank-'))
  const modulePath = join(directory, 'question-bank.cjs')
  writeFileSync(modulePath, output)

  const require = createRequire(modulePath)
  const Module = require('node:module')
  const originalLoad = Module._load
  Module._load = (request, parent, isMain) => request === 'server-only' ? {} : originalLoad(request, parent, isMain)

  try {
    return require(modulePath)
  } finally {
    Module._load = originalLoad
    rmSync(directory, { recursive: true, force: true })
  }
}

test('la banque contient exactement 24 questions équilibrées et complètes', () => {
  const { tageMageDiagnosticQuestionBank } = loadQuestionBank()

  assert.ok(Array.isArray(tageMageDiagnosticQuestionBank))
  assert.equal(tageMageDiagnosticQuestionBank.length, 24)
  assert.equal(new Set(tageMageDiagnosticQuestionBank.map((question) => question.id)).size, 24, 'les identifiants doivent être uniques')

  for (const section of expectedSections) {
    assert.equal(
      tageMageDiagnosticQuestionBank.filter((question) => question.section === section).length,
      4,
      `${section} doit contenir quatre questions`,
    )
  }

  for (const question of tageMageDiagnosticQuestionBank) {
    assert.equal(typeof question.id, 'string')
    assert.ok(question.id.length > 0)
    assert.ok(expectedSections.includes(question.section))
    assert.equal(typeof question.prompt, 'string')
    assert.ok(question.prompt.trim().length > 0)
    assert.ok(Array.isArray(question.options))
    assert.equal(question.options.length, 5)
    assert.ok(question.options.every((option) => typeof option === 'string' && option.trim().length > 0))
    assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 5)
    assert.equal(typeof question.explanation, 'string')
    assert.ok(question.explanation.trim().length > 0)
    assert.equal(typeof question.method, 'string')
    assert.ok(question.method.trim().length > 0)
    assert.ok([1, 2, 3].includes(question.difficulty))
    assert.ok(Number.isFinite(question.estimatedSeconds) && question.estimatedSeconds > 0)
    assert.equal(question.contentVersion, 1)
  }
})

test('la version publique retire systématiquement les corrigés', () => {
  const { tageMageDiagnosticQuestionBank, getPublicTageMageDiagnosticQuestions } = loadQuestionBank()
  const publicQuestions = getPublicTageMageDiagnosticQuestions()

  assert.equal(publicQuestions.length, tageMageDiagnosticQuestionBank.length)
  assert.notStrictEqual(publicQuestions, tageMageDiagnosticQuestionBank)

  for (const question of publicQuestions) {
    assert.equal('correctIndex' in question, false)
    assert.equal('explanation' in question, false)
    assert.equal('method' in question, false)
    assert.equal(question.options.length, 5)
  }
})

test('le snapshot conserve une copie immuable des questions corrigées', () => {
  const { tageMageDiagnosticQuestionBank, createTageMageQuestionSnapshot } = loadQuestionBank()
  const snapshot = createTageMageQuestionSnapshot()

  assert.deepEqual(snapshot, tageMageDiagnosticQuestionBank)
  assert.notStrictEqual(snapshot, tageMageDiagnosticQuestionBank)
  assert.notStrictEqual(snapshot[0], tageMageDiagnosticQuestionBank[0])
  assert.notStrictEqual(snapshot[0].options, tageMageDiagnosticQuestionBank[0].options)

  snapshot[0].prompt = 'Question modifiée après la tentative'
  snapshot[0].options[0] = 'Choix modifié après la tentative'

  assert.notEqual(snapshot[0].prompt, tageMageDiagnosticQuestionBank[0].prompt)
  assert.notEqual(snapshot[0].options[0], tageMageDiagnosticQuestionBank[0].options[0])
})

test('la migration de rétroalimentation embarque exactement la banque v1', () => {
  const { tageMageDiagnosticQuestionBank } = loadQuestionBank()
  const migration = readFileSync(new URL('../supabase/migrations/025_tage_mage_question_snapshots.sql', import.meta.url), 'utf8')
  const match = migration.match(/set question_snapshot = '(.+)'::jsonb\nwhere/)

  assert.ok(match, 'la migration doit contenir le snapshot JSON de la version 1')
  const migrationSnapshot = JSON.parse(match[1].replaceAll("''", "'"))
  assert.deepEqual(migrationSnapshot, tageMageDiagnosticQuestionBank)
})
