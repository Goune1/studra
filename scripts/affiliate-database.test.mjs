import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const root = process.cwd()
const userA = '00000000-0000-4000-8000-000000000001'
const userB = '00000000-0000-4000-8000-000000000002'
const admin = '00000000-0000-4000-8000-000000000003'

async function database() {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create table public.profiles (
      id uuid primary key, email text, plan text default 'free', stripe_customer_id text,
      stripe_subscription_id text, stripe_current_period_end timestamptz,
      subscription_cancel_at_period_end boolean default false, updated_at timestamptz default now()
    );
  `)
  for (const migration of ['013_affiliate.sql', '016_affiliate_production.sql', '017_affiliate_payout_method_guard.sql']) {
    await db.exec(await readFile(join(root, 'supabase/migrations', migration), 'utf8'))
  }
  return db
}

test('la migration et le cycle financier résistent aux doublons et événements désordonnés', async () => {
  const db = await database()
  try {
    await db.exec(`insert into profiles(id,email) values ('${userA}','a@test.fr'),('${userB}','b@test.fr'),('${admin}','admin@test.fr')`)
    await db.exec(`select set_config('request.jwt.claim.sub','${userA}',false); set role authenticated`)
    const registered = await db.query(`select * from register_affiliate('Alice','Affiliée','a@test.fr','paypal','a@paypal.fr',null,null,null,'2026-08-11')`)
    assert.equal(registered.rows.length, 1)
    const affiliateId = registered.rows[0].id
    const code = registered.rows[0].referral_code

    await assert.rejects(() => db.query(`update affiliates set commission_rate=99 where id='${affiliateId}' returning id`))
    await assert.rejects(() => db.exec(`insert into affiliate_commissions(affiliate_id,referred_user_id,stripe_invoice_id,amount_revenue,amount_commission) values ('${affiliateId}','${userB}','evil',100,100)`))
    await db.exec('reset role')

    assert.equal((await db.query(`select apply_stripe_subscription_state('${userB}','sub_new','cus_b',true,false,'2026-08-02','2026-09-02',false,'2026-08-03') as ok`)).rows[0].ok, true)
    assert.equal((await db.query(`select apply_stripe_subscription_state('${userB}','sub_old','cus_b',true,false,'2026-08-01','2026-09-01',false,'2026-08-04') as ok`)).rows[0].ok, false)
    assert.equal((await db.query(`select apply_stripe_subscription_state('${userB}','sub_old','cus_b',false,true,'2026-08-01',null,false,'2026-08-05') as ok`)).rows[0].ok, false)
    assert.equal((await db.query(`select apply_stripe_subscription_state('${userB}','sub_new','cus_b',false,true,'2026-08-02',null,false,'2026-08-06') as ok`)).rows[0].ok, true)
    assert.equal((await db.query(`select apply_stripe_subscription_state('${userB}','sub_new','cus_b',true,false,'2026-08-02','2026-09-02',false,'2026-08-05') as ok`)).rows[0].ok, false)
    assert.equal((await db.query(`select plan from profiles where id='${userB}'`)).rows[0].plan, 'free')

    assert.equal((await db.query(`select affiliate_attribute_referral('${code}','${userB}',true) as ok`)).rows[0].ok, true)
    const first = await db.query(`select affiliate_record_commission_and_reconcile('${userB}','in_1','sub_1','cus_1','pi_1',499,'eur',now()-interval '31 days') as id`)
    const duplicate = await db.query(`select affiliate_record_commission_and_reconcile('${userB}','in_1','sub_1','cus_1','pi_1',499,'eur',now()-interval '31 days') as id`)
    assert.equal(first.rows[0].id, duplicate.rows[0].id)

    await db.query(`select affiliate_record_or_queue_adjustment('pi_2','refund:early','refund',250,500,'early',null,'early refund')`)
    await db.query(`select affiliate_reverse_dispute('dp_early')`)
    await db.query(`select affiliate_record_or_queue_adjustment('pi_2','dispute:dp_early','dispute',100,500,null,'dp_early','early dispute')`)
    await db.query(`select affiliate_record_commission_and_reconcile('${userB}','in_2','sub_2','cus_2','pi_2',400,'eur',now()-interval '31 days')`)
    assert.equal((await db.query(`select processed_at is not null as ok from affiliate_pending_adjustments where source_id='refund:early'`)).rows[0].ok, true)
    assert.equal((await db.query(`select processed_at is not null as ok from affiliate_pending_dispute_reversals where stripe_dispute_id='dp_early'`)).rows[0].ok, true)
    assert.equal((await db.query(`select count(*)::int as n from affiliate_commissions where source_id in ('dispute:dp_early','dispute_reversal:dp_early')`)).rows[0].n, 2)

    await db.query(`select affiliate_record_commission_and_reconcile('${userB}','in_3','sub_3','cus_3','pi_3',400,'eur',now()-interval '31 days')`)
    await db.query(`select affiliate_record_or_queue_adjustment('pi_3','dispute:dp_overlap','dispute',500,500,null,'dp_overlap','full dispute')`)
    await db.query(`select affiliate_record_or_queue_adjustment('pi_3','refund:overlap','refund',250,500,'overlap',null,'overlapping refund')`)
    assert.equal((await db.query(`select processed_at is null as ok from affiliate_pending_adjustments where source_id='refund:overlap'`)).rows[0].ok, true)
    await db.query(`select affiliate_reverse_dispute('dp_overlap')`)
    assert.equal((await db.query(`select processed_at is not null as ok from affiliate_pending_adjustments where source_id='refund:overlap'`)).rows[0].ok, true)
    assert.equal((await db.query(`select count(*)::int as n from affiliate_commissions where source_id='refund:overlap'`)).rows[0].n, 1)

    await db.query(`select affiliate_record_adjustment('invoice:in_1','refund:re_1','refund',-250,-1,'re_1',null,'partial refund')`)
    await db.query(`select affiliate_record_adjustment('invoice:in_1','refund:re_1','refund',-250,-1,'re_1',null,'duplicate')`)
    assert.equal((await db.query(`select count(*)::int as n from affiliate_commissions where stripe_refund_id='re_1'`)).rows[0].n, 1)

    await db.query('select affiliate_mature_commissions(now())')
    await db.exec('update affiliate_settings set minimum_payout_minor=1 where id=1')
    await assert.rejects(() => db.query(`select affiliate_prepare_payout('${affiliateId}','eur','bank_transfer','${admin}','batch-wrong-method')`))
    const payout = await db.query(`select affiliate_prepare_payout('${affiliateId}','eur','paypal','${admin}','batch-1') as id`)
    const samePayout = await db.query(`select affiliate_prepare_payout('${affiliateId}','eur','paypal','${admin}','batch-1') as id`)
    assert.equal(payout.rows[0].id, samePayout.rows[0].id)
    await assert.rejects(() => db.query(`select affiliate_prepare_payout('${affiliateId}','eur','bank_transfer','${admin}','batch-1')`))
    await db.query(`select affiliate_record_adjustment('invoice:in_1','refund:re_2','refund',-100,-1,'re_2',null,'refund during payout')`)
    assert.equal((await db.query(`select status from affiliate_commissions where stripe_refund_id='re_2'`)).rows[0].status, 'payable')
    await db.query(`select affiliate_confirm_payout('${payout.rows[0].id}','paypal-transfer-42','${admin}')`)
    assert.equal((await db.query(`select status from affiliate_payouts where id='${payout.rows[0].id}'`)).rows[0].status, 'paid')

    assert.equal((await db.query(`select affiliate_claim_stripe_event('evt_1','invoice.paid','in_1') as ok`)).rows[0].ok, true)
    await db.query(`select affiliate_complete_stripe_event('evt_1')`)
    assert.equal((await db.query(`select affiliate_claim_stripe_event('evt_1','invoice.paid','in_1') as ok`)).rows[0].ok, false)
  } finally {
    await db.close()
  }
})
