import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const forgot = read('src/app/api/auth/forgot-password/route.ts')
const reset = read('src/app/api/auth/reset-password/route.ts')
const resend = read('src/lib/resend.ts')
const loginClient = read('src/app/[locale]/(auth)/login/page-client.tsx')

test('forgot-password ne révèle jamais l’existence d’un compte', () => {
  // Aucun status 404 / message "compte introuvable" : tous les chemins nominaux
  // retournent la même réponse générique.
  assert.doesNotMatch(forgot, /introuvable|n'existe pas|not found/i)
  assert.match(forgot, /GENERIC_OK/)
  // Le seul status d'erreur autorisé est le rate limit et le mail invalide reste silencieux.
  const statuses = [...forgot.matchAll(/status:\s*(\d{3})/g)].map((m) => m[1])
  assert.deepEqual([...new Set(statuses)], ['429'])
})

test('forgot-password est rate-limité par IP', () => {
  assert.match(forgot, /checkRateLimit\(ip,\s*'auth:forgot-password'/)
})

test('forgot-password génère un lien recovery côté service role', () => {
  assert.match(forgot, /getSupabaseAdmin\(\)/)
  assert.match(forgot, /generateLink\(\{\s*\n?\s*type:\s*'recovery'/)
  assert.match(forgot, /hashed_token/)
})

test('le lien de reset est localisé et porte le token_hash', () => {
  assert.match(forgot, /getLocalizedPathname\('\/reset-password',\s*locale\)/)
  assert.match(forgot, /searchParams\.set\('token_hash'/)
  assert.match(forgot, /searchParams\.set\('type',\s*'recovery'\)/)
})

test('le token n’est jamais renvoyé au client', () => {
  assert.doesNotMatch(forgot, /NextResponse\.json\(\{[^}]*hashed_token/)
  assert.doesNotMatch(forgot, /NextResponse\.json\(\{[^}]*resetUrl/)
})

test('reset-password valide le token avant de changer le mot de passe', () => {
  const verifyIndex = reset.indexOf('verifyOtp')
  const updateIndex = reset.indexOf('updateUser')
  assert.ok(verifyIndex > -1, 'verifyOtp absent')
  assert.ok(updateIndex > -1, 'updateUser absent')
  assert.ok(verifyIndex < updateIndex, 'updateUser ne doit pas précéder verifyOtp')
})

test('reset-password impose une longueur de mot de passe cohérente avec Supabase', () => {
  assert.match(reset, /password\.length\s*<\s*8\s*\|\|\s*password\.length\s*>\s*72/)
})

test('reset-password ne laisse pas de session ouverte si la mise à jour échoue', () => {
  assert.match(reset, /if \(updateError\) \{\s*\n\s*await supabase\.auth\.signOut\(\)/)
})

test('le template email de reset existe et utilise l’URL d’action', () => {
  assert.match(resend, /passwordReset:\s*\{/)
  assert.match(resend, /body:\s*\(resetUrl\)/)
  assert.match(resend, /export async function sendPasswordResetEmail/)
})

test('les emails existants continuent de pointer vers le dashboard', () => {
  assert.match(resend, /const url = actionUrl \?\? localizedDashboardUrl\(locale\)/)
})

test('la page de connexion expose le lien mot de passe oublié', () => {
  assert.match(loginClient, /href="\/forgot-password"/)
  assert.match(loginClient, /t\('forgotPassword'\)/)
})
