import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('les tentatives ne sont insérables que par la route serveur privilégiée', () => {
  const migration = source('supabase/migrations/024_tage_mage_diagnostic.sql')
  const route = source('src/app/api/tage-mage/diagnostic/submit/route.ts')

  assert.doesNotMatch(
    migration,
    /create policy[^;]+tage_mage_diagnostic_attempts[^;]+for insert/is,
    'aucune policy RLS ne doit autoriser un client authentifié à fabriquer une tentative',
  )
  assert.match(route, /getSupabaseAdmin\(\)/, 'la route serveur doit utiliser le client Supabase privilégié après authentification')
  assert.match(route, /checkRateLimit\(user\.id, 'tage-mage-diagnostic-submit', 20, 3600\)/, 'les tentatives doivent être limitées par utilisateur')
  assert.match(route, /admin[\s\S]+\.from\('tage_mage_diagnostic_attempts'\)/, 'l’insertion doit passer par le client admin')
})

test('la durée persistée est recalculée depuis les réponses validées et bornée', () => {
  const route = source('src/app/api/tage-mage/diagnostic/submit/route.ts')
  const client = source('src/app/(dashboard)/tage-mage/diagnostic/diagnostic-client.tsx')

  assert.match(route, /const MAX_DIAGNOSTIC_DURATION_SECONDS = 14_400/)
  assert.match(route, /value <= MAX_DIAGNOSTIC_DURATION_SECONDS/)
  assert.match(route, /duration_seconds:\s*score\.durationSeconds/)
  assert.doesNotMatch(route, /duration_seconds:\s*submission\.durationSeconds/)
  assert.doesNotMatch(client, /durationSeconds:\s*totalSeconds/)
})

test('une soumission répétée retourne la tentative existante', () => {
  const migration = source('supabase/migrations/025_tage_mage_question_snapshots.sql')
  const route = source('src/app/api/tage-mage/diagnostic/submit/route.ts')
  const client = source('src/app/(dashboard)/tage-mage/diagnostic/diagnostic-client.tsx')

  assert.match(migration, /submission_id uuid/)
  assert.match(migration, /unique index[^;]+user_id, submission_id/is)
  assert.match(client, /submissionId/)
  assert.match(route, /submission_id:\s*submission\.submissionId/)
  assert.match(route, /error\?\.code === '23505'/)
  assert.match(route, /\.eq\('submission_id', submission\.submissionId\)/)
})

test('la mise à jour de l’objectif actualise updated_at', () => {
  const action = source('src/app/(dashboard)/tage-mage/onboarding-actions.ts')
  assert.match(action, /updated_at:\s*new Date\(\)\.toISOString\(\)/)
})

test('les anciens résultats utilisent le snapshot enregistré avec la tentative', () => {
  const migration = source('supabase/migrations/025_tage_mage_question_snapshots.sql')
  const route = source('src/app/api/tage-mage/diagnostic/submit/route.ts')
  const resultsPage = source('src/app/(dashboard)/tage-mage/results/[attemptId]/page.tsx')

  assert.match(migration, /add column if not exists question_snapshot jsonb/)
  assert.match(migration, /alter column question_snapshot set not null/)
  assert.match(route, /question_snapshot:\s*createTageMageQuestionSnapshot\(\)/)
  assert.match(resultsPage, /question_snapshot/)
  assert.match(resultsPage, /const questions = attempt\.question_snapshot/)
  assert.doesNotMatch(resultsPage, /question-bank\.server/)
  assert.doesNotMatch(resultsPage, /attempt\.content_version\s*!==/)
})

test('la page du module redirige les visiteurs non authentifiés', () => {
  const modulePage = source('src/app/(dashboard)/tage-mage/page.tsx')

  assert.match(modulePage, /if \(!user\) redirect\('\/login'\)/)
  assert.doesNotMatch(modulePage, /if \(!user\) return null/)
})
