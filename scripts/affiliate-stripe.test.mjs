import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

const root = process.cwd()
const source = (path) => readFileSync(join(root, path), 'utf8')

test('le calcul de commission travaille uniquement en unités mineures entières', async () => {
  const moduleUrl = pathToFileURL(join(root, 'src/lib/affiliate-money.ts')).href
  const {calculateCommissionMinor, calculateCumulativeAdjustmentMinor} = await import(moduleUrl)

  assert.equal(calculateCommissionMinor(999, 2000), 200)
  assert.equal(calculateCommissionMinor(1, 5000), 1)
  assert.equal(calculateCommissionMinor(1000, 0), 0)
  assert.throws(() => calculateCommissionMinor(10.5, 2000), /integer/i)
  assert.throws(() => calculateCommissionMinor(1000, 10001), /rate/i)

  assert.equal(calculateCumulativeAdjustmentMinor(2000, 500, 0, 1000), -250)
  assert.equal(calculateCumulativeAdjustmentMinor(2000, 500, 250, 2000), -250)
  assert.equal(calculateCumulativeAdjustmentMinor(2000, 500, 500, 2000), 0)
})

test('le webhook Stripe a une enveloppe idempotente avec échec rejouable', () => {
  const webhook = source('src/app/api/webhooks/stripe/route.ts')
  assert.match(webhook, /affiliate_claim_stripe_event/)
  assert.match(webhook, /affiliate_complete_stripe_event/)
  assert.match(webhook, /affiliate_fail_stripe_event/)
  assert.match(source('supabase/migrations/016_affiliate_production.sql'), /processing_started_at < now\(\) - interval '10 minutes'/)
  assert.match(webhook, /return NextResponse\.json\([^)]*status: 500/s)
  assert.match(webhook, /invoice\.paid/)
  assert.match(webhook, /charge\.refunded/)
  assert.match(webhook, /refund\.created/)
  assert.match(webhook, /charge\.dispute\.created/)
  assert.match(webhook, /charge\.dispute\.closed/)
  assert.doesNotMatch(webhook, /\bas any\b/)
})

test('les commissions et ajustements Stripe passent exclusivement par les RPC atomiques', () => {
  const affiliate = source('src/lib/affiliate.ts')
  assert.match(affiliate, /affiliate_record_commission/)
  assert.match(affiliate, /affiliate_record_or_queue_adjustment/)
  assert.match(affiliate, /affiliate_reverse_dispute/)
  assert.doesNotMatch(affiliate, /from\('affiliate_commissions'\)\.insert/)
  assert.doesNotMatch(affiliate, /amountRevenue\s*\*\s*params\.commissionRate/)
})

test('le checkout réutilise le customer et emploie une clé d’idempotence', () => {
  const checkoutRoute = source('src/app/api/billing/checkout/route.ts')
  const stripe = source('src/lib/stripe.ts')
  assert.match(checkoutRoute, /stripe_customer_id/)
  assert.match(checkoutRoute, /stripe_subscription_id/)
  assert.match(stripe, /customer:\s*customerId/)
  assert.match(stripe, /idempotencyKey/)
  assert.doesNotMatch(stripe, /customer_email:\s*email,/)
})

test('les événements Stripe désordonnés ne peuvent pas restaurer un ancien abonnement', () => {
  const webhook = source('src/app/api/webhooks/stripe/route.ts')
  const migration = source('supabase/migrations/016_affiliate_production.sql')
  assert.match(webhook, /apply_stripe_subscription_state/)
  assert.match(webhook, /p_subscription_created_at/)
  assert.match(migration, /p_subscription_created_at < v_profile\.stripe_subscription_created_at/)
  assert.match(migration, /p_deleted and v_profile\.stripe_subscription_id is distinct from p_subscription_id/)
})

test('la commission exclut les taxes et les remboursements sont recalculés proportionnellement', () => {
  const webhook = source('src/app/api/webhooks/stripe/route.ts')
  const affiliate = source('src/lib/affiliate.ts')
  const migration = source('supabase/migrations/016_affiliate_production.sql')
  assert.match(webhook, /total_excluding_tax/)
  assert.match(webhook, /transactionAmountMinor: charge\.amount/)
  assert.match(affiliate, /p_transaction_amount_minor/)
  assert.match(migration, /p_refund_amount_minor::numeric \* v_parent\.amount_revenue_minor \/ p_transaction_amount_minor/)
  assert.match(migration, /affiliate_pending_adjustments/)
  assert.match(migration, /affiliate_record_commission_and_reconcile/)
})
