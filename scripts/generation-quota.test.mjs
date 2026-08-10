import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Every route that charges a generation credit.
const QUOTA_ROUTES = [
  'src/app/api/generate/fiche/route.ts',
  'src/app/api/generate/flashcards/route.ts',
  'src/app/api/generate/schema/route.ts',
  'src/app/api/generate/timeline/route.ts',
  'src/app/api/generate/exam/route.ts',
  'src/app/api/generate/annales/route.ts',
  'src/app/api/generate/study-plan/route.ts',
  'src/app/api/socrate/sessions/route.ts',
  'src/app/api/recall/sessions/[sessionId]/evaluate/route.ts',
]

// The bug: the "generate also" panel fires one request per content type in
// parallel. With a read-modify-write quota the N requests all read the same
// counter and all write the same incremented value, so N generations cost a
// single credit — and a free user at 4/5 can exceed the cap.
for (const route of QUOTA_ROUTES) {
  const source = read(route)

  test(`${route} ne fait plus de read-modify-write sur le compteur`, () => {
    assert.doesNotMatch(
      source,
      /generations_used_this_month/,
      'la route manipule encore le compteur directement au lieu de passer par la fonction atomique',
    )
    assert.doesNotMatch(source, /currentGenerations/)
    assert.doesNotMatch(source, /monthDiff/)
  })

  test(`${route} consomme le crédit via la fonction atomique`, () => {
    assert.match(source, /consumeGenerationCredit\(user\.id\)/)
    assert.match(source, /if \(!credit\.allowed\)/)
  })

  test(`${route} renvoie le code quota_exceeded exploitable par le paywall`, () => {
    assert.match(source, /code:\s*'quota_exceeded'/)
  })

  test(`${route} valide la requête avant de débiter`, () => {
    // On cible l'appel, pas la ligne d'import.
    const consumeIndex = source.indexOf('await consumeGenerationCredit(')
    const lastValidation = source.lastIndexOf('status: 400')
    assert.ok(consumeIndex > -1, 'appel à consumeGenerationCredit introuvable')
    if (lastValidation === -1) return // route sans validation 400
    assert.ok(
      consumeIndex > lastValidation,
      'le crédit est débité avant la validation : une requête invalide consommerait une génération',
    )
  })

  test(`${route} rembourse le crédit si la génération échoue`, () => {
    assert.match(source, /refundGenerationCredit\(user\.id\)/)
  })
}

test('le helper de quota expose une consommation atomique et un remboursement', () => {
  const helper = read('src/lib/generation-quota.ts')
  assert.match(helper, /export async function consumeGenerationCredit/)
  assert.match(helper, /export async function refundGenerationCredit/)
  assert.match(helper, /rpc\('consume_generation_credit'/)
  assert.match(helper, /rpc\('refund_generation_credit'/)
})

test('le helper échoue en mode fermé si la RPC casse', () => {
  const helper = read('src/lib/generation-quota.ts')
  // Une erreur de quota ne doit pas offrir des générations gratuites.
  assert.match(helper, /if \(error\) \{[\s\S]*?return \{allowed: false/)
})

test('la migration SQL sérialise les appels concurrents', () => {
  const sql = read('supabase/migrations/015_atomic_generation_quota.sql')
  assert.match(sql, /create or replace function public\.consume_generation_credit/)
  assert.match(sql, /create or replace function public\.refund_generation_credit/)
  // Le verrou de ligne est ce qui empêche les lectures simultanées identiques.
  assert.match(sql, /for update/)
  // L'incrément se fait à partir de la valeur en base, pas d'une valeur lue côté app.
  assert.match(sql, /generations_used_this_month = generations_used_this_month \+ 1/)
  // Le remboursement ne doit jamais rendre le compteur négatif.
  assert.match(sql, /greatest\(0, generations_used_this_month - 1\)/)
  assert.match(sql, /security definer/)
})

test('les fonctions de quota ne sont pas exposées au client', () => {
  const sql = read('supabase/migrations/015_atomic_generation_quota.sql')
  assert.match(sql, /revoke all on function public\.consume_generation_credit\(uuid, integer\) from public/)
  assert.match(sql, /revoke all on function public\.refund_generation_credit\(uuid\) from public/)
  // Seul le service_role appelle ces fonctions, jamais anon/authenticated.
  assert.doesNotMatch(sql, /grant execute on function public\.consume_generation_credit[^;]*anon/)
  assert.doesNotMatch(sql, /grant execute on function public\.consume_generation_credit[^;]*authenticated/)
})
