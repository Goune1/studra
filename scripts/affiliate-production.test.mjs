import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

const root = process.cwd()
const migrationPath = join(root, 'supabase/migrations/016_affiliate_production.sql')

function migration() {
  assert.ok(existsSync(migrationPath), 'la migration de sécurisation affiliation doit exister')
  return readFileSync(migrationPath, 'utf8')
}

test('la migration retire les écritures RLS dangereuses et borne les données financières', () => {
  const sql = migration()
  assert.match(sql, /drop policy if exists "Affiliates can update own profile"/i)
  assert.match(sql, /drop policy if exists "Authenticated users can insert own affiliate"/i)
  assert.match(sql, /commission_rate[^;]+between 0 and 100/is)
  assert.match(sql, /amount_revenue_minor[^;]+check[^;]+>= 0/is)
  assert.match(sql, /amount_commission_minor[^;]+check[^;]+<> 0/is)
  assert.match(sql, /currency[^;]+check[^;]+char_length\(currency\) = 3/is)
  assert.match(sql, /paid_at[^;]+status[^;]+paid/is)
})

test('les mutations financières sont atomiques et réservées au service role', () => {
  const sql = migration()
  for (const fn of [
    'affiliate_record_commission',
    'affiliate_record_adjustment',
    'affiliate_mature_commissions',
    'affiliate_prepare_payout',
    'affiliate_confirm_payout',
    'affiliate_fail_payout',
    'affiliate_claim_stripe_event',
    'affiliate_complete_stripe_event',
    'affiliate_fail_stripe_event',
  ]) {
    assert.match(sql, new RegExp(`function public\\.${fn}\\(`, 'i'), `${fn} doit être défini`)
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+to service_role`, 'is'), `${fn} doit être service_role only`)
  }
  assert.match(sql, /for update skip locked/i)
  assert.match(sql, /affiliate_payout_items/i)
  assert.match(sql, /affiliate_admin_audit_log/i)
})

test('l’inscription et les coordonnées affilié passent par des RPC à colonnes contrôlées', () => {
  const sql = migration()
  assert.match(sql, /function public\.register_affiliate\(/i)
  assert.match(sql, /function public\.update_affiliate_payment_method\(/i)
  assert.match(sql, /grant execute on function public\.register_affiliate[^;]+to authenticated/is)
  assert.match(sql, /grant execute on function public\.update_affiliate_payment_method[^;]+to authenticated/is)
  assert.doesNotMatch(sql, /grant\s+(insert|update)\s+on\s+public\.affiliates\s+to\s+authenticated/i)
})

test('le registre conserve les remboursements et clawbacks comme ajustements immuables', () => {
  const sql = migration()
  assert.match(sql, /entry_type[^;]+commission[^;]+refund[^;]+dispute[^;]+manual_adjustment/is)
  assert.match(sql, /v_parent\.status in \('paid', 'approved'\) then 'payable'/i)
  assert.match(sql, /parent_commission_id/i)
  assert.match(sql, /source_id/i)
  assert.match(sql, /available_at/i)
  assert.match(sql, /rate_bps/i)
  assert.match(sql, /stripe_refund_id/i)
  assert.match(sql, /stripe_dispute_id/i)
  assert.match(sql, /affiliate_pending_adjustments/i)
  assert.match(sql, /affiliate_record_commission_and_reconcile/i)
  assert.match(sql, /affiliate_pending_dispute_reversals/i)
})
