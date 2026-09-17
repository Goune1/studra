import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')

function sourceFiles(dir = join(root, 'src')) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) ? [relative(root, path)] : []
  })
}

const EXPECTED_ROUTES = [
  'src/app/api/generate/annales/route.ts',
  'src/app/api/generate/exam/route.ts',
  'src/app/api/generate/fiche/route.ts',
  'src/app/api/generate/flashcards/route.ts',
  'src/app/api/generate/schema/route.ts',
  'src/app/api/generate/study-plan/route.ts',
  'src/app/api/generate/timeline/route.ts',
  'src/app/api/recall/sessions/[sessionId]/evaluate/route.ts',
  'src/app/api/socrate/sessions/route.ts',
]

// « Génération réussie » = une route qui consomme un crédit. Découverte
// automatique : une nouvelle route de génération sans hook fait échouer le test.
const creditRoutes = sourceFiles().filter((file) => /consumeGenerationCredit\(user\.id\)/.test(read(file))).sort()

test('les routes qui consomment un crédit sont exactement les 9 attendues', () => {
  assert.deepEqual(creditRoutes, EXPECTED_ROUTES)
})

for (const route of EXPECTED_ROUTES) {
  test(`${route} qualifie le parrainage après la génération réussie, sans attendre`, () => {
    const source = read(route)
    assert.match(source, /import \{ after, NextResponse \} from 'next\/server'/)
    assert.match(source, /import \{ processReferralQualification \} from '@\/lib\/referral'/)
    assert.equal(source.match(/processReferralQualification\(/g)?.length, 1, 'un seul appel')
    assert.doesNotMatch(source, /await processReferralQualification/, 'jamais attendu dans la réponse')

    const hook = source.indexOf('after(() => processReferralQualification(user.id))')
    const lastRefund = source.lastIndexOf('refundGenerationCredit(user.id)')
    const lastSuccess = source.lastIndexOf('return NextResponse.json(')
    assert.ok(hook > 0, 'hook présent')
    assert.ok(hook > lastRefund, 'après le dernier chemin d’échec remboursé')
    assert.ok(hook < lastSuccess, 'avant la réponse de succès')
    assert.equal(source.slice(hook, lastSuccess).match(/return /g), null, 'aucun retour entre le hook et le succès')
  })
}

test('referral_qualify n’est appelée que depuis src/lib/referral.ts, qui ne lève jamais', () => {
  const callers = sourceFiles().filter((file) => /referral_qualify/.test(read(file)))
  assert.deepEqual(callers, ['src/lib/referral.ts'])
  const referral = read('src/lib/referral.ts')
  const body = referral.slice(referral.indexOf('export async function processReferralQualification'))
  assert.match(body, /try \{[\s\S]*catch \(error\) \{[\s\S]*return null/)
})
