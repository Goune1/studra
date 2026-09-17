import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isReferralCode,
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  setReferralCookie,
} from '../src/lib/referral-code.ts'

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')

function fakeExchange(url, existingCookie) {
  const written = []
  const request = {
    nextUrl: new URL(url),
    cookies: { get: (name) => (name === REFERRAL_COOKIE && existingCookie !== undefined ? { value: existingCookie } : undefined) },
  }
  const response = { cookies: { set: (name, value, options) => written.push({ name, value, options }) } }
  return { request, response, written }
}

test('format du code : exactement 8 caractères de l’alphabet sans ambiguïté', () => {
  for (const valid of ['ABCDEFGH', 'X25C2F94', 'KNB4BV9T', '23456789']) assert.equal(isReferralCode(valid), true, valid)
  for (const invalid of [null, undefined, '', 'abcdefgh', 'ABCDEFG', 'ABCDEFGHJ', 'ABCDEFG0', 'ABCDEFGO', 'ABCDEFG1', 'ABCDEFGI', 'ABCDEFGL', 'ABCD EFG', 'jean1234abcd']) {
    assert.equal(isReferralCode(invalid), false, String(invalid))
  }
})

test('le proxy pose un cookie httpOnly sameSite=lax de 30 jours pour un code valide', () => {
  const { request, response, written } = fakeExchange('https://www.studra.fr/?ref=X25C2F94')
  setReferralCookie(request, response)
  assert.deepEqual(written, [{
    name: 'studra_referral',
    value: 'X25C2F94',
    options: { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 60 * 60 * 24 * 30 },
  }])
  assert.equal(REFERRAL_COOKIE_MAX_AGE, 2_592_000)
})

test('aucun cookie pour un ref absent, invalide ou d’affiliation (minuscules)', () => {
  for (const url of ['https://www.studra.fr/', 'https://www.studra.fr/?ref=', 'https://www.studra.fr/?ref=x25c2f94', 'https://www.studra.fr/?ref=jeanab12cd34', 'https://www.studra.fr/?ref=ABCDEFG0']) {
    const { request, response, written } = fakeExchange(url)
    setReferralCookie(request, response)
    assert.deepEqual(written, [], url)
  }
})

test('first-touch : un cookie valide existant n’est pas écrasé, un cookie corrompu l’est', () => {
  const kept = fakeExchange('https://www.studra.fr/?ref=X25C2F94', 'KNB4BV9T')
  setReferralCookie(kept.request, kept.response)
  assert.deepEqual(kept.written, [])

  const replaced = fakeExchange('https://www.studra.fr/?ref=X25C2F94', 'garbage')
  setReferralCookie(replaced.request, replaced.response)
  assert.equal(replaced.written[0]?.value, 'X25C2F94')
})

test('le module de format ne dépend de rien (aucune requête DB possible depuis le proxy)', () => {
  assert.doesNotMatch(read('src/lib/referral-code.ts'), /^\s*import\s/m)
})

test('le proxy pose le cookie sur ses deux chemins de réponse', () => {
  const proxy = read('src/proxy.ts')
  assert.equal(proxy.match(/setReferralCookie\(request, response\)/g)?.length, 2)
  assert.doesNotMatch(proxy, /referral_attribute|getSupabaseAdmin|\.rpc\(/)
})

test('l’inscription email et le callback OAuth attribuent via le cookie', () => {
  for (const file of ['src/app/api/auth/register/route.ts', 'src/app/auth/callback/route.ts']) {
    const source = read(file)
    assert.match(source, /import \{ attributeReferralFromCookie \} from '@\/lib\/referral'/, file)
    assert.match(source, /await attributeReferralFromCookie\((?:data\.user\.id, 'email'|user\.id, user\.app_metadata\?\.provider \?\? 'oauth')\)/, file)
  }
  const referral = read('src/lib/referral.ts')
  assert.match(referral, /rpc\('referral_attribute'/)
  assert.match(referral, /cookieStore\.delete\(REFERRAL_COOKIE\)/)
})

test('AffiliateTracker n’appelle pas /api/affiliate/track pour un code de parrainage', () => {
  const tracker = read('src/components/affiliate/AffiliateTracker.tsx')
  const guard = tracker.indexOf('if (!ref || isReferralCode(ref)) return')
  const call = tracker.indexOf("fetch('/api/affiliate/track'")
  assert.ok(guard > 0, 'test de format présent')
  assert.ok(call > guard, 'le test de format précède l’appel réseau')
})
