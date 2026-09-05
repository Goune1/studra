import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

const root = process.cwd()
const source = (path) => readFileSync(join(root, path), 'utf8')

test('le cookie d’attribution est signé, HttpOnly, Secure et expire en 30 jours', async () => {
  process.env.AFFILIATE_COOKIE_SECRET = 'test-secret-that-is-long-enough-for-hmac'
  const moduleUrl = pathToFileURL(join(root, 'src/lib/affiliate-cookie.ts')).href
  const {signAffiliateCookie, verifyAffiliateCookie} = await import(moduleUrl)
  const signed = signAffiliateCookie('gael1234')
  assert.equal(verifyAffiliateCookie(signed), 'gael1234')
  assert.equal(verifyAffiliateCookie(`${signed}x`), null)

  const tracking = source('src/app/api/affiliate/track/route.ts')
  assert.match(tracking, /httpOnly:\s*true/)
  assert.match(tracking, /secure:\s*process\.env\.NODE_ENV === 'production'/)
  assert.match(tracking, /60 \* 60 \* 24 \* 30/)
  assert.match(tracking, /checkRateLimit/)
})

test('le lien affilié passe par une redirection serveur et ne dépend pas de JavaScript', () => {
  const dashboard = source('src/components/affiliate/AffiliateDashboard.tsx')
  const tracking = source('src/app/api/affiliate/track/route.ts')
  assert.match(dashboard, /\/api\/affiliate\/track\?ref=/)
  assert.match(tracking, /NextResponse\.redirect/)
  assert.match(`${tracking}\n${source('src/lib/affiliate.ts')}`, /dedupe_key/)
})

test('l’attribution email reste pending avant vérification puis devient qualifiée', () => {
  const register = source('src/app/api/auth/register/route.ts')
  const callback = source('src/app/auth/callback/route.ts')
  assert.match(register, /email_confirmed_at/)
  assert.match(register, /attributeReferral\(refCode, data\.user\.id,/)
  assert.match(callback, /qualifyReferral/)
  assert.doesNotMatch(register, /getAffiliateByCode/)
})

test('les affiliés ne peuvent modifier que leurs coordonnées via des RPC étroites', () => {
  const actions = source('src/app/[locale]/(dashboard)/affiliate/actions.ts')
  assert.match(actions, /rpc\('register_affiliate'/)
  assert.match(actions, /rpc\('update_affiliate_payment_method'/)
  assert.doesNotMatch(actions, /from\('affiliates'\)\.insert/)
  assert.doesNotMatch(actions, /from\('affiliates'\)[\s\S]+\.update\(/)

  const form = source('src/components/affiliate/AffiliateRegistrationForm.tsx')
  assert.match(form, /terms_version/)
  assert.match(form, /type="checkbox"/)
})

test('le paiement manuel est préparé puis confirmé séparément avec référence obligatoire', () => {
  const payout = source('src/app/api/admin/affiliates/[id]/payout/route.ts')
  assert.match(payout, /affiliate_prepare_payout/)
  assert.match(payout, /affiliate_confirm_payout/)
  assert.match(payout, /affiliate_fail_payout/)
  assert.doesNotMatch(payout, /from\('affiliate_payouts'\)\.insert/)
  assert.doesNotMatch(payout, /from\('affiliate_commissions'\)\.update/)
})

test('le paiement manuel utilise uniquement les coordonnées vérifiées de l’affilié', () => {
  const payout = source('src/app/api/admin/affiliates/[id]/payout/route.ts')
  const admin = source('src/app/admin/affiliates/[id]/page.tsx')
  const guard = source('supabase/migrations/017_affiliate_payout_method_guard.sql')
  assert.match(payout, /\['paypal', 'bank_transfer'\]/)
  assert.doesNotMatch(payout, /'other'/)
  assert.match(admin, /setPayoutMethod\(d\.affiliate\?\.payment_method/)
  assert.doesNotMatch(admin, /<option value="other">/)
  assert.match(guard, /p_payment_method is distinct from v_affiliate\.payment_method/)
  assert.match(guard, /payment_details_incomplete/)
})
