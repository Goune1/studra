import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMigration,
  asServiceRole,
  createDeployedDatabase,
  rejectsWith,
  signUp,
} from './support/deployed-schema.mjs'

const referrer = '00000000-0000-4000-8000-0000000000a1'
const outsider = '00000000-0000-4000-8000-0000000000a2'
const filleul = (n) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`
const DAY_MS = 86_400_000

async function database({ filleuls = 8 } = {}) {
  const db = await createDeployedDatabase({
    seedUsers: [[referrer, 'parrain@test.fr'], [outsider, 'outsider@test.fr']],
  })
  for (const migration of ['020_referral_schema.sql', '021_pro_entitlement.sql', '022_referral_attribution.sql', '023_referral_qualification.sql']) {
    await applyMigration(db, migration)
  }
  const { rows: [{ referral_code: code }] } = await db.query('select referral_code from profiles where id = $1', [referrer])
  await db.exec(`update auth.users set email_confirmed_at = now()`)
  for (let n = 1; n <= filleuls; n++) {
    await signUp(db, filleul(n), `filleul${n}@test.fr`)
    await db.query('update auth.users set email_confirmed_at = now() where id = $1', [filleul(n)])
    await asServiceRole(db, () => db.query('select * from referral_attribute($1, $2)', [code, filleul(n)]))
  }
  return db
}

const qualify = async (db, userId) =>
  (await asServiceRole(db, () => db.query('select * from referral_qualify($1)', [userId]))).rows
const proUntilMs = async (db) =>
  (await db.query(`select extract(epoch from pro_until) * 1000 as ms from profiles where id = $1`, [referrer])).rows[0].ms
const isPro = async (db) => (await db.query('select public.is_pro(p) as v from profiles p where id = $1', [referrer])).rows[0].v
const rewards = async (db) => (await db.query('select sequence, months from referral_rewards order by sequence')).rows

test('premier filleul qualifié : pas encore de mois, et un second appel ne fait rien', async () => {
  const db = await database()
  try {
    const [first] = await qualify(db, filleul(1))
    assert.equal(first.referrer_id, referrer)
    assert.equal(first.qualified_count, 1)
    assert.equal(first.reward_id, null)
    assert.equal(first.reward_sequence, null)
    assert.deepEqual(await qualify(db, filleul(1)), [], 'idempotent')
    assert.equal(await isPro(db), false)
    const { rows: [row] } = await db.query('select status, qualified_at is not null as qualified from referrals where referred_id = $1', [filleul(1)])
    assert.deepEqual(row, { status: 'qualified', qualified: true })
  } finally {
    await db.close()
  }
})

test('email non confirmé : pas de qualification tant que la confirmation manque', async () => {
  const db = await database()
  try {
    await db.query('update auth.users set email_confirmed_at = null where id = $1', [filleul(1)])
    assert.deepEqual(await qualify(db, filleul(1)), [])
    await db.query('update auth.users set email_confirmed_at = now() where id = $1', [filleul(1)])
    assert.equal((await qualify(db, filleul(1))).length, 1)
  } finally {
    await db.close()
  }
})

test('deux filleuls qualifiés : 1 mois de Pro, les deux lignes consommées par la même récompense', async () => {
  const db = await database()
  try {
    await qualify(db, filleul(1))
    const before = Date.now()
    const [second] = await qualify(db, filleul(2))
    assert.equal(second.qualified_count, 2)
    assert.equal(second.reward_sequence, 1)
    assert.ok(second.reward_id)
    const until = await proUntilMs(db)
    assert.ok(until >= before + 28 * DAY_MS && until <= Date.now() + 31 * DAY_MS, 'now() + 1 mois')
    assert.equal(await isPro(db), true, 'is_pro reconnaît le Pro offert')

    const { rows } = await db.query('select reward_id, consumed_at is not null as consumed from referrals where referred_id in ($1, $2)', [filleul(1), filleul(2)])
    assert.deepEqual(rows.map((row) => row.reward_id), [second.reward_id, second.reward_id])
    assert.ok(rows.every((row) => row.consumed))
    assert.deepEqual(await rewards(db), [{ sequence: 1, months: 1 }])
  } finally {
    await db.close()
  }
})

test('cumul : max(now(), pro_until) + 1 mois, que le Pro offert coure encore ou soit expiré', async () => {
  const db = await database()
  try {
    await qualify(db, filleul(1))
    await qualify(db, filleul(2))
    const afterFirst = await proUntilMs(db)
    await qualify(db, filleul(3))
    await qualify(db, filleul(4))
    const afterSecond = await proUntilMs(db)
    const gainDays = (afterSecond - afterFirst) / DAY_MS
    assert.ok(gainDays >= 28 && gainDays <= 31, `le 2e mois s'ajoute au premier (${gainDays} jours)`)

    await asServiceRole(db, () => db.query(`update profiles set pro_until = now() - interval '10 days' where id = $1`, [referrer]))
    assert.equal(await isPro(db), false)
    const before = Date.now()
    await qualify(db, filleul(5))
    await qualify(db, filleul(6))
    const afterExpired = await proUntilMs(db)
    assert.ok(afterExpired >= before + 28 * DAY_MS && afterExpired <= Date.now() + 31 * DAY_MS, 'repart de now() après expiration')
  } finally {
    await db.close()
  }
})

test('plafond : 3 mois pour 6 filleuls, les suivants restent qualifiés sans récompense', async () => {
  const db = await database({ filleuls: 8 })
  try {
    for (let n = 1; n <= 6; n++) await qualify(db, filleul(n))
    const capped = await proUntilMs(db)
    assert.deepEqual(await rewards(db), [{ sequence: 1, months: 1 }, { sequence: 2, months: 1 }, { sequence: 3, months: 1 }])

    const [seventh] = await qualify(db, filleul(7))
    const [eighth] = await qualify(db, filleul(8))
    assert.equal(seventh.reward_id, null)
    assert.equal(eighth.reward_id, null)
    assert.equal(eighth.qualified_count, 8)
    assert.equal(await proUntilMs(db), capped, 'pro_until inchangé au-delà du plafond')
    assert.equal((await rewards(db)).length, 3)

    const { rows: [counts] } = await db.query(`
      select count(*) filter (where consumed_at is null)::int as unconsumed,
             count(*) filter (where status = 'qualified')::int as qualified
      from referrals`)
    assert.deepEqual(counts, { unconsumed: 2, qualified: 8 })
  } finally {
    await db.close()
  }
})

test('un nombre impair de qualifications ne consomme jamais un filleul seul', async () => {
  const db = await database({ filleuls: 3 })
  try {
    await qualify(db, filleul(1))
    await qualify(db, filleul(2))
    const [third] = await qualify(db, filleul(3))
    assert.equal(third.reward_id, null)
    const { rows: [row] } = await db.query('select consumed_at, reward_id from referrals where referred_id = $1', [filleul(3)])
    assert.deepEqual(row, { consumed_at: null, reward_id: null })
  } finally {
    await db.close()
  }
})

test('utilisateur non parrainé, inconnu ou filleul supprimé : aucun effet', async () => {
  const db = await database({ filleuls: 1 })
  try {
    assert.deepEqual(await qualify(db, outsider), [])
    assert.deepEqual(await qualify(db, '00000000-0000-4000-8000-0000000000ff'), [])
    await db.query('delete from auth.users where id = $1', [filleul(1)])
    assert.deepEqual(await qualify(db, filleul(1)), [])
    assert.deepEqual(await rewards(db), [])
  } finally {
    await db.close()
  }
})

test('referral_qualify n’est appelable que par le service role', async () => {
  const db = await database({ filleuls: 1 })
  try {
    const { rows: [grants] } = await db.query(`
      select has_function_privilege('anon', 'public.referral_qualify(uuid)', 'execute') as anon,
             has_function_privilege('authenticated', 'public.referral_qualify(uuid)', 'execute') as auth,
             has_function_privilege('service_role', 'public.referral_qualify(uuid)', 'execute') as service`)
    assert.deepEqual(grants, { anon: false, auth: false, service: true })
    await db.exec('set role authenticated')
    await rejectsWith(db.query('select * from referral_qualify($1)', [filleul(1)]), /permission denied/)
    await db.exec('reset role')
  } finally {
    await db.close()
  }
})
