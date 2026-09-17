import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMigration,
  asAnon,
  asServiceRole,
  asUser,
  createDeployedDatabase,
} from './support/deployed-schema.mjs'

const owner = '00000000-0000-4000-8000-000000000001'
const free = '00000000-0000-4000-8000-000000000002'
const stripePro = '00000000-0000-4000-8000-000000000003'
const offered = '00000000-0000-4000-8000-000000000004'
const expired = '00000000-0000-4000-8000-000000000005'
const CONTENT_TABLES = ['decks', 'flashcards', 'fiches', 'schemas', 'timelines']

// Même jeu de données, avec ou sans 021 : ce que chaque profil voit du contenu
// public d'un autre utilisateur, et ce que le quota lui accorde sur 6 appels.
async function scenario({ with021 }) {
  const db = await createDeployedDatabase({
    seedUsers: [
      [owner, 'owner@test.fr'],
      [free, 'free@test.fr'],
      [stripePro, 'stripe@test.fr'],
      [offered, 'offered@test.fr'],
      [expired, 'expired@test.fr'],
    ],
  })
  try {
    await applyMigration(db, '020_referral_schema.sql')
    await asServiceRole(db, async () => {
      await db.query(`update profiles set plan = 'pro', stripe_customer_id = 'cus_1', stripe_subscription_id = 'sub_1' where id = $1`, [stripePro])
      await db.query(`update profiles set pro_until = now() + interval '15 days' where id = $1`, [offered])
      await db.query(`update profiles set pro_until = now() - interval '1 day' where id = $1`, [expired])
    })
    const { rows: [deck] } = await db.query(`insert into decks (user_id, title, is_public) values ($1, 'public', true) returning id`, [owner])
    const { rows: [privateDeck] } = await db.query(`insert into decks (user_id, title, is_public) values ($1, 'private', false) returning id`, [owner])
    await db.query(`insert into flashcards (deck_id, question) values ($1, 'q1'), ($2, 'q2')`, [deck.id, privateDeck.id])
    for (const table of ['fiches', 'schemas', 'timelines']) {
      await db.query(`insert into ${table} (user_id, title, is_public) values ($1, 'public', true), ($1, 'private', false)`, [owner])
    }

    if (with021) await applyMigration(db, '021_pro_entitlement.sql')

    const visibility = {}
    for (const [name, id] of [['free', free], ['stripePro', stripePro], ['offered', offered], ['expired', expired], ['owner', owner]]) {
      visibility[name] = await asUser(db, id, async () => {
        const counts = {}
        for (const table of CONTENT_TABLES) {
          counts[table] = (await db.query(`select count(*)::int as n from ${table}`)).rows[0].n
        }
        return counts
      })
    }
    visibility.anon = await asAnon(db, async () => {
      const counts = {}
      for (const table of CONTENT_TABLES) {
        counts[table] = (await db.query(`select count(*)::int as n from ${table}`)).rows[0].n
      }
      return counts
    })

    const quota = {}
    for (const [name, id] of [['free', free], ['stripePro', stripePro], ['offered', offered], ['expired', expired], ['unknown', '00000000-0000-4000-8000-0000000000ff']]) {
      quota[name] = await asServiceRole(db, async () => {
        const calls = []
        for (let i = 0; i < 6; i++) {
          const { rows: [row] } = await db.query('select * from consume_generation_credit($1, 5)', [id])
          calls.push(row)
        }
        return calls
      })
    }

    return { visibility, quota }
  } finally {
    await db.close()
  }
}

const allowedPattern = (calls) => calls.map((call) => call.allowed)

test('021 ne change rien pour les profils sans pro_until : policies et quota identiques avant/après', async () => {
  const before = await scenario({ with021: false })
  const after = await scenario({ with021: true })

  for (const name of ['free', 'stripePro', 'owner', 'anon']) {
    assert.deepEqual(after.visibility[name], before.visibility[name], `visibilité inchangée pour ${name}`)
  }
  for (const name of ['free', 'stripePro', 'unknown']) {
    assert.deepEqual(after.quota[name], before.quota[name], `quota inchangé pour ${name}`)
  }

  assert.deepEqual(before.visibility.free, { decks: 0, flashcards: 0, fiches: 0, schemas: 0, timelines: 0 })
  assert.deepEqual(before.visibility.stripePro, { decks: 1, flashcards: 1, fiches: 1, schemas: 1, timelines: 1 })
  assert.deepEqual(before.visibility.anon, { decks: 0, flashcards: 0, fiches: 0, schemas: 0, timelines: 0 })
  assert.deepEqual(before.visibility.owner, { decks: 2, flashcards: 2, fiches: 2, schemas: 2, timelines: 2 })
  assert.deepEqual(allowedPattern(before.quota.free), [true, true, true, true, true, false])
  assert.deepEqual(allowedPattern(before.quota.stripePro), [true, true, true, true, true, true])
  assert.ok(before.quota.stripePro.every((call) => call.is_pro === true))
  assert.deepEqual(allowedPattern(before.quota.unknown), [false, false, false, false, false, false])
})

test('pro_until est ignoré avant 021, puis ouvre le Pro tant qu’il court, et plus après expiration', async () => {
  const before = await scenario({ with021: false })
  const after = await scenario({ with021: true })

  assert.deepEqual(before.visibility.offered, before.visibility.free, 'avant 021, un Pro offert est traité en gratuit')
  assert.deepEqual(allowedPattern(before.quota.offered), [true, true, true, true, true, false])

  assert.deepEqual(after.visibility.offered, after.visibility.stripePro, 'après 021, un Pro offert actif voit le contenu public Pro')
  assert.deepEqual(allowedPattern(after.quota.offered), [true, true, true, true, true, true])
  assert.ok(after.quota.offered.every((call) => call.is_pro === true))

  assert.deepEqual(after.visibility.expired, after.visibility.free, 'un Pro offert expiré redevient gratuit')
  assert.deepEqual(allowedPattern(after.quota.expired), [true, true, true, true, true, false])
  assert.ok(after.quota.expired.every((call) => call.is_pro === false))
})

test('is_pro est lisible comme champ calculé, et la règle plan = pro ne subsiste que dans is_pro', async () => {
  const db = await createDeployedDatabase({ seedUsers: [[offered, 'offered@test.fr'], [free, 'free@test.fr']] })
  try {
    await applyMigration(db, '020_referral_schema.sql')
    await applyMigration(db, '021_pro_entitlement.sql')
    await asServiceRole(db, async () => {
      await db.query(`update profiles set pro_until = now() + interval '1 month' where id = $1`, [offered])
    })

    // Notation attribut utilisée par PostgREST pour select=is_pro.
    const seenByOffered = await asUser(db, offered, () => db.query('select profiles.is_pro, profiles.plan from profiles'))
    assert.deepEqual(seenByOffered.rows, [{ is_pro: true, plan: 'free' }])
    const seenByFree = await asUser(db, free, () => db.query('select profiles.is_pro from profiles'))
    assert.deepEqual(seenByFree.rows, [{ is_pro: false }])

    const { rows: policies } = await db.query(`
      select policyname, qual from pg_policies where policyname like 'Pro users can view public%'`)
    assert.equal(policies.length, 5)
    for (const policy of policies) {
      assert.match(policy.qual, /is_pro/, `${policy.policyname} passe par is_pro`)
      assert.doesNotMatch(policy.qual, /plan/, `${policy.policyname} ne teste plus plan directement`)
    }

    const { rows: [consume] } = await db.query(`select pg_get_functiondef('public.consume_generation_credit(uuid,integer)'::regprocedure) as def`)
    assert.match(consume.def, /public\.is_pro\(p\)/)
    assert.doesNotMatch(consume.def, /'pro'/)

    const { rows: [grants] } = await db.query(`
      select has_function_privilege('authenticated', 'public.is_pro(public.profiles)', 'execute') as auth_is_pro,
             has_function_privilege('anon', 'public.is_pro(public.profiles)', 'execute') as anon_is_pro,
             has_function_privilege('authenticated', 'public.consume_generation_credit(uuid,integer)', 'execute') as auth_consume,
             has_function_privilege('service_role', 'public.consume_generation_credit(uuid,integer)', 'execute') as service_consume`)
    assert.deepEqual(grants, { auth_is_pro: true, anon_is_pro: true, auth_consume: false, service_consume: true })
  } finally {
    await db.close()
  }
})
