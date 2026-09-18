import test from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const insightsUrl = pathToFileURL(new URL('../src/lib/tage-mage/insights.ts', import.meta.url).pathname).href
const typesUrl = pathToFileURL(new URL('../src/lib/tage-mage/types.ts', import.meta.url).pathname).href

const { rankTageMageSections, getTageMageNextStep, TAGE_MAGE_SECTION_NEXT_STEPS } = await import(insightsUrl)
const { TAGE_MAGE_SECTIONS } = await import(typesUrl)

const result = (section, correctCount, averageDurationSeconds = 40) => ({ section, correctCount, totalQuestions: 4, averageDurationSeconds })

test('un sous-test n’est jamais à la fois point d’appui et priorité', () => {
  const { strengths, priorities } = rankTageMageSections([
    result('comprehension', 4), result('calcul', 4), result('conditions_minimales', 4),
    result('expression', 4), result('raisonnement_argumentation', 4), result('logique', 4),
  ])

  assert.equal(priorities.length, 0)
  assert.equal(strengths.length, 3)
})

test('les priorités vont du plus faible au plus fort, le plus lent d’abord à égalité', () => {
  const { priorities, strengths } = rankTageMageSections([
    result('comprehension', 3, 30), result('calcul', 1, 30), result('conditions_minimales', 3, 80),
    result('expression', 4), result('raisonnement_argumentation', 2), result('logique', 4),
  ])

  assert.deepEqual(priorities.map((item) => item.section), ['calcul', 'raisonnement_argumentation', 'conditions_minimales'])
  assert.deepEqual(strengths.map((item) => item.section), ['logique', 'expression', 'comprehension'])
})

test('un résultat faible partout ne produit pas de faux point d’appui', () => {
  const { strengths } = rankTageMageSections([
    result('comprehension', 2), result('calcul', 2), result('conditions_minimales', 1),
    result('expression', 2), result('raisonnement_argumentation', 1), result('logique', 2),
  ])

  assert.equal(strengths.length, 0)
})

test('chaque sous-test a une prochaine action concrète', () => {
  for (const section of TAGE_MAGE_SECTIONS) {
    assert.ok(TAGE_MAGE_SECTION_NEXT_STEPS[section]?.length > 40, section)
  }
  assert.equal(getTageMageNextStep('inconnu'), null)
})

test('le parcours annonce son cadre avant la première question et marque correctement les réponses', async () => {
  const { readFileSync } = await import('node:fs')
  const client = readFileSync(new URL('../src/app/(dashboard)/tage-mage/diagnostic/diagnostic-client.tsx', import.meta.url), 'utf8')
  const results = readFileSync(new URL('../src/app/(dashboard)/tage-mage/results/[attemptId]/page.tsx', import.meta.url), 'utf8')

  assert.match(client, /if \(startedAt === null\)/, 'un écran d’entrée précède la première question')
  assert.match(client, /Ce n’est pas le TAGE MAGE officiel/)
  assert.match(client, /trackTageMageDiagnosticStarted\(\)[\s\S]*function begin|function begin\(\)[\s\S]*trackTageMageDiagnosticStarted\(\)/)
  assert.doesNotMatch(client, /selectedIndex !== null\}/, 'une question jamais visitée ne doit pas être marquée comme répondue')
  assert.match(client, /confirmingSubmit/, 'terminer avec des questions sans réponse demande une confirmation')
  assert.match(client, /aria-pressed=/, 'les choix utilisent une sémantique de boutons sélectionnables')
  assert.doesNotMatch(client, /role="radiogroup"/, 'ne pas annoncer un radiogroup sans navigation aux flèches')
  assert.match(results, /rankTageMageSections\(sectionResults\)/)
  assert.match(results, /Ta prochaine action/)
  assert.match(results, /version \{attempt\.content_version\}/)
})
