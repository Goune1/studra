import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  applyMigration,
  asServiceRole,
  createDeployedDatabase,
  rejectsWith,
  signUp,
} from './support/deployed-schema.mjs'

const referrer = '00000000-0000-4000-8000-0000000000a1'
const other = '00000000-0000-4000-8000-0000000000a2'
const newcomer = '00000000-0000-4000-8000-0000000000b1'
const newcomer2 = '00000000-0000-4000-8000-0000000000b2'
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function database() {
  const db = await createDeployedDatabase({
    seedUsers: [[referrer, 'Jean.Dupont+studra@gmail.com'], [other, 'claire@outlook.fr']],
  })
  await applyMigration(db, '020_referral_schema.sql')
  await applyMigration(db, '021_pro_entitlement.sql')
  await applyMigration(db, '022_referral_attribution.sql')
  return db
}

const codeOf = async (db, id) => (await db.query('select referral_code from profiles where id = $1', [id])).rows[0].referral_code
const attribute = (db, code, referredId) =>
  asServiceRole(db, () => db.query('select * from referral_attribute($1, $2)', [code, referredId]))
const referralsCount = async (db) => (await db.query('select count(*)::int as n from referrals')).rows[0].n

test('normalize_email : minuscules partout, points et +tag retirés pour gmail uniquement', async () => {
  const db = await database()
  try {
    const cases = [
      ['Jean.Dupont+studra@Gmail.com', 'jeandupont@gmail.com'],
      ['j.e.a.n.dupont@googlemail.com', 'jeandupont@gmail.com'],
      ['  JeanDupont@GMAIL.COM ', 'jeandupont@gmail.com'],
      ['Claire.Martin+pro@Outlook.fr', 'claire.martin+pro@outlook.fr'],
    ]
    for (const [input, expected] of cases) {
      const { rows: [row] } = await db.query('select normalize_email($1) as email, referral_email_hash($1) as hash', [input])
      assert.equal(row.email, expected, input)
      assert.equal(row.hash, sha256(expected), `hash de ${input}`)
    }
  } finally {
    await db.close()
  }
})

test('un nouvel inscrit est attribué en pending, sans exposer son email', async () => {
  const db = await database()
  try {
    await signUp(db, newcomer, 'Newcomer@Test.fr')
    const { rows } = await attribute(db, await codeOf(db, referrer), newcomer)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].referrer_id, referrer)

    const { rows: [referral] } = await db.query('select * from referrals')
    assert.equal(referral.referred_id, newcomer)
    assert.equal(referral.status, 'pending')
    assert.equal(referral.referred_email_hash, sha256('newcomer@test.fr'))
    assert.equal(referral.qualified_at, null)
  } finally {
    await db.close()
  }
})

test('codes invalides, inconnus ou en minuscules : aucune attribution', async () => {
  const db = await database()
  try {
    await signUp(db, newcomer, 'newcomer@test.fr')
    const code = await codeOf(db, referrer)
    for (const candidate of [null, '', 'ABC', code.toLowerCase(), `${code}X`, 'ABCDEFG0', 'AAAAAAAA']) {
      const { rows } = await attribute(db, candidate, newcomer)
      assert.equal(rows.length, 0, `code ${candidate}`)
    }
    assert.equal(await referralsCount(db), 0)
  } finally {
    await db.close()
  }
})

test('auto-parrainage refusé : même compte, ou même email gmail normalisé', async () => {
  const db = await database()
  try {
    const code = await codeOf(db, referrer)
    assert.equal((await attribute(db, code, referrer)).rows.length, 0, 'même utilisateur')

    await signUp(db, newcomer, 'jeandupont+alt@googlemail.com')
    assert.equal((await attribute(db, code, newcomer)).rows.length, 0, 'variante gmail du même email')

    await signUp(db, newcomer2, 'claire+pro@outlook.fr')
    const otherCode = await codeOf(db, other)
    assert.equal((await attribute(db, otherCode, newcomer2)).rows.length, 1, 'le +tag hors gmail reste un email distinct')
  } finally {
    await db.close()
  }
})

test('un compte existant (profil de plus d’une heure) n’est jamais attribué', async () => {
  const db = await database()
  try {
    await signUp(db, newcomer, 'newcomer@test.fr')
    await db.query(`update profiles set created_at = now() - interval '2 hours' where id = $1`, [newcomer])
    assert.equal((await attribute(db, await codeOf(db, referrer), newcomer)).rows.length, 0)
    assert.equal(await referralsCount(db), 0)
  } finally {
    await db.close()
  }
})

test('le code d’un compte banni (anonymisé) ou supprimé ne résout plus', async () => {
  const db = await database()
  try {
    await signUp(db, newcomer, 'newcomer@test.fr')
    await signUp(db, newcomer2, 'newcomer2@test.fr')
    await db.query(`update auth.users set banned_until = now() + interval '100 years' where id = $1`, [referrer])
    assert.equal((await attribute(db, await codeOf(db, referrer), newcomer)).rows.length, 0, 'banni')
    await db.query(`update auth.users set deleted_at = now() where id = $1`, [other])
    assert.equal((await attribute(db, await codeOf(db, other), newcomer2)).rows.length, 0, 'supprimé')
  } finally {
    await db.close()
  }
})

test('jamais réattribué : ni par un second parrain, ni après suppression puis recréation du compte', async () => {
  const db = await database()
  try {
    await signUp(db, newcomer, 'newcomer@test.fr')
    assert.equal((await attribute(db, await codeOf(db, referrer), newcomer)).rows.length, 1)
    assert.equal((await attribute(db, await codeOf(db, other), newcomer)).rows.length, 0, 'second parrain')
    assert.equal((await attribute(db, await codeOf(db, referrer), newcomer)).rows.length, 0, 'second appel idempotent')

    await db.query('delete from auth.users where id = $1', [newcomer])
    await signUp(db, newcomer2, 'NewComer@test.fr')
    assert.equal((await attribute(db, await codeOf(db, other), newcomer2)).rows.length, 0, 'même email recréé')

    const { rows } = await db.query('select referrer_id, referred_id from referrals')
    assert.deepEqual(rows, [{ referrer_id: referrer, referred_id: null }])
  } finally {
    await db.close()
  }
})

test('les fonctions d’attribution ne sont appelables que par le service role', async () => {
  const db = await database()
  try {
    const { rows: [grants] } = await db.query(`
      select
        has_function_privilege('anon', 'public.referral_attribute(text,uuid)', 'execute') as anon_attr,
        has_function_privilege('authenticated', 'public.referral_attribute(text,uuid)', 'execute') as auth_attr,
        has_function_privilege('service_role', 'public.referral_attribute(text,uuid)', 'execute') as service_attr,
        has_function_privilege('authenticated', 'public.normalize_email(text)', 'execute') as auth_normalize`)
    assert.deepEqual(grants, { anon_attr: false, auth_attr: false, service_attr: true, auth_normalize: false })

    await db.exec('set role authenticated')
    await rejectsWith(db.query(`select * from referral_attribute('ABCDEFGH', $1)`, [newcomer]), /permission denied/)
    await db.exec('reset role')
  } finally {
    await db.close()
  }
})
