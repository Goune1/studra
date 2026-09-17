import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

process.env.RESEND_API_KEY ??= 're_test_referral'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://www.studra.fr'
const { referralQualifiedEmail, referralRewardEmail } = await import('../src/lib/resend.ts')

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
// « © » du pied de page existant est Extended_Pictographic sans être un emoji.
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u

test('email de qualification : progression, lien vers la page, sujet sans emoji', () => {
  const { subject, html } = referralQualifiedEmail({ progress: 1 })
  assert.equal(subject, "Un de tes filleuls vient d'être qualifié")
  assert.doesNotMatch(subject, EMOJI)
  assert.doesNotMatch(html, EMOJI)
  assert.match(html, /Tu es à 1\/2 vers ton prochain mois de Pro offert\./)
  assert.match(html, /href="[^"]*\/settings\/parrainage"/)
  assert.match(html, /<!DOCTYPE html>/, 'réutilise baseLayout')
})

test('email de qualification au plafond : le parrainage compte mais ne donne plus de mois', () => {
  const { html } = referralQualifiedEmail({ progress: null })
  assert.match(html, /déjà obtenu tes 3 mois offerts/)
  assert.doesNotMatch(html, /vers ton prochain mois/)
})

test('email de récompense : date française, rang du mois, mention Stripe seulement si abonné', () => {
  const first = referralRewardEmail({ sequence: 1, proUntil: '2026-10-14T09:30:00Z', hasStripeSubscription: false })
  assert.equal(first.subject, 'Tu as gagné un mois de Studra Pro')
  assert.doesNotMatch(first.subject, EMOJI)
  assert.doesNotMatch(first.html, EMOJI)
  assert.match(first.html, /jusqu'au <strong>14 octobre 2026<\/strong>/)
  assert.match(first.html, /Mois offerts obtenus : 1\/3\./)
  assert.doesNotMatch(first.html, /abonnement en cours/)
  assert.match(first.html, /href="[^"]*\/settings\/parrainage"/)

  const last = referralRewardEmail({ sequence: 3, proUntil: '2026-12-31T23:30:00Z', hasStripeSubscription: true })
  assert.match(last.html, /3e et dernier mois offert/)
  assert.match(last.html, /abonnement en cours continue normalement/)
  assert.match(last.html, /1 janvier 2027/, 'fuseau Europe/Paris')
})

const referral = read('src/lib/referral.ts')

function captureCall(event) {
  const start = referral.indexOf(`'${event}'`)
  assert.ok(start > 0, `${event} envoyé`)
  const open = referral.lastIndexOf('captureServerEvent(', start)
  const close = referral.indexOf('})', start)
  return referral.slice(open, close + 2)
}

test('referral_signup : méthode, parrain et had_affiliate_attribution, après la réponse', () => {
  const call = captureCall('referral_signup')
  for (const key of ['referral_id', 'referrer_id', 'method', 'had_affiliate_attribution']) assert.match(call, new RegExp(`\\b${key}\\b`))
  assert.match(referral, /after\(\(\) => trackReferralSignup\(attribution, referredUserId, method\)\)/)
  assert.match(referral, /\.from\('affiliate_referrals'\)\s*\.select\('id'\)/, 'lecture seule de l’affiliation')
  assert.doesNotMatch(referral, /\.from\('affiliate_referrals'\)[^;]*\.(insert|update|upsert|delete)\(/)
})

test('referral_qualified et referral_reward_granted portent les propriétés utiles', () => {
  const qualified = captureCall('referral_qualified')
  for (const key of ['referral_id', 'referred_user_id', 'qualified_count', 'progress', 'triggered_reward']) assert.match(qualified, new RegExp(`\\b${key}\\b`))
  const reward = captureCall('referral_reward_granted')
  for (const key of ['reward_id', 'reward_sequence', 'months', 'pro_until', 'cap_reached', 'has_stripe_subscription']) assert.match(reward, new RegExp(`\\b${key}\\b`))
})

test('aucun email ni donnée personnelle dans les événements PostHog', () => {
  for (const event of ['referral_signup', 'referral_qualified', 'referral_reward_granted']) {
    assert.doesNotMatch(captureCall(event), /\bemail\b|full_name/, event)
  }
})

test('un seul email par qualification : récompense si un mois est accordé, sinon qualification', () => {
  const rewardBranch = referral.indexOf('if (reward) {')
  const elseBranch = referral.indexOf('} else if (email) {', rewardBranch)
  assert.ok(rewardBranch > 0 && elseBranch > rewardBranch)
  assert.match(referral.slice(rewardBranch, elseBranch), /sendReferralRewardEmail/)
  assert.doesNotMatch(referral.slice(rewardBranch, elseBranch), /sendReferralQualifiedEmail/)
  assert.match(referral.slice(elseBranch, elseBranch + 200), /sendReferralQualifiedEmail/)
  assert.match(referral, /deliverableEmail/, 'pas d’envoi aux comptes anonymisés')
})

test('les notifications ne partent que sur une transition réelle, sans pouvoir lever', () => {
  const body = referral.slice(referral.indexOf('export async function processReferralQualification'))
  const earlyReturn = body.indexOf('if (!row?.referral_id || !row.referrer_id) return null')
  const notify = body.indexOf('await notifyReferralQualification(qualification, userId)')
  assert.ok(earlyReturn > 0 && notify > earlyReturn)
  const notifyBody = referral.slice(referral.indexOf('async function notifyReferralQualification'))
  assert.match(notifyBody, /try \{[\s\S]*Promise\.allSettled[\s\S]*catch \(error\)/)
})

test('referral_link_created est envoyé côté client après une copie réussie, avec son emplacement', () => {
  const analytics = read('src/lib/analytics.ts')
  assert.match(analytics, /export type ReferralLinkSource = 'settings_parrainage' \| 'dashboard_banner'/)
  assert.match(analytics, /capture\('referral_link_created', \{ source \}\)/)
  const button = read('src/components/referral/CopyReferralLinkButton.tsx')
  assert.ok(button.indexOf('trackReferralLinkCreated(source)') > button.indexOf('await navigator.clipboard.writeText(link)'))
  assert.match(read('src/app/(dashboard)/settings/parrainage/parrainage-view.tsx'), /<CopyReferralLinkButton link=\{link\} source="settings_parrainage" \/>/)
})

test('le webhook Stripe garde son propre envoi PostHog, sans dépendre du parrainage', () => {
  const webhook = read('src/app/api/webhooks/stripe/route.ts')
  assert.match(webhook, /async function capturePostHog\(/)
  assert.doesNotMatch(webhook, /posthog-server|referral/)
})
