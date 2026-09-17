import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMigration,
  asServiceRole,
  asUser,
  createDeployedDatabase,
  rejectsWith,
  signUp,
} from './support/deployed-schema.mjs'

const alice = '00000000-0000-4000-8000-00000000000a'
const bob = '00000000-0000-4000-8000-00000000000b'
const carol = '00000000-0000-4000-8000-00000000000c'
const dave = '00000000-0000-4000-8000-00000000000d'
const hash = (char) => char.repeat(64)

async function database({ seedBeforeMigration = [] } = {}) {
  const db = await createDeployedDatabase({ seedUsers: seedBeforeMigration })
  await applyMigration(db, '020_referral_schema.sql')
  return db
}

test('020 backfille un code unique et conforme pour chaque profil existant', async () => {
  const db = await database({
    seedBeforeMigration: [[alice, 'alice@test.fr'], [bob, 'bob@test.fr'], [carol, 'carol@test.fr']],
  })
  try {
    const { rows } = await db.query('select referral_code from profiles')
    assert.equal(rows.length, 3)
    assert.equal(new Set(rows.map((row) => row.referral_code)).size, 3)
    for (const { referral_code: code } of rows) {
      assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
    }
    const { rows: [column] } = await db.query(`
      select is_nullable, column_default from information_schema.columns
      where table_name = 'profiles' and column_name = 'referral_code'`)
    assert.equal(column.is_nullable, 'NO')
    assert.match(column.column_default, /generate_referral_code/)
    const { rows: [proUntil] } = await db.query(`select count(*)::int as n from profiles where pro_until is not null`)
    assert.equal(proUntil.n, 0, 'pro_until doit rester NULL partout')
  } finally {
    await db.close()
  }
})

test('un nouvel inscrit reçoit un code via le trigger handle_new_user existant', async () => {
  const db = await database()
  try {
    await signUp(db, dave, 'dave@test.fr')
    const { rows: [profile] } = await db.query('select referral_code from profiles where id = $1', [dave])
    assert.match(profile.referral_code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
    await asServiceRole(db, async () => {
      await rejectsWith(db.query(`update profiles set referral_code = 'abc' where id = $1`, [dave]), /profiles_referral_code_format/)
    })
  } finally {
    await db.close()
  }
})

test("un utilisateur ne peut modifier ni pro_until ni referral_code, le service role le peut", async () => {
  const db = await database()
  try {
    await signUp(db, alice, 'alice@test.fr')
    await asUser(db, alice, async () => {
      await rejectsWith(
        db.query(`update profiles set pro_until = now() + interval '1 year' where id = $1`, [alice]),
        /cannot modify server-managed columns/,
      )
      await rejectsWith(
        db.query(`update profiles set referral_code = 'ABCDEFGH' where id = $1`, [alice]),
        /cannot modify server-managed columns/,
      )
      await rejectsWith(db.query(`update profiles set plan = 'pro' where id = $1`, [alice]), /cannot modify server-managed columns/)
      const updated = await db.query(`update profiles set full_name = 'Alice' where id = $1 returning id`, [alice])
      assert.equal(updated.rows.length, 1, 'les colonnes non gardées restent modifiables')
    })
    await asServiceRole(db, async () => {
      await db.query(`update profiles set pro_until = now() + interval '1 month' where id = $1`, [alice])
    })
    const { rows: [profile] } = await db.query('select pro_until is not null as granted from profiles where id = $1', [alice])
    assert.equal(profile.granted, true)
  } finally {
    await db.close()
  }
})

test('RLS : le parrain lit ses lignes sans jamais voir le filleul, et n’écrit rien', async () => {
  const db = await database()
  try {
    for (const [id, email] of [[alice, 'alice@test.fr'], [bob, 'bob@test.fr'], [carol, 'carol@test.fr'], [dave, 'dave@test.fr']]) {
      await signUp(db, id, email)
    }
    const { rows: [reward] } = await db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 1) returning id`, [alice])
    await db.query(`
      insert into referrals (referrer_id, referred_id, referred_email_hash, status, qualified_at, consumed_at, reward_id) values
        ($1, $2, $4, 'qualified', now(), now(), $5),
        ($1, $3, $6, 'qualified', now(), now(), $5)`, [alice, bob, carol, hash('b'), reward.id, hash('c')])
    await db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [dave, alice, hash('a')])

    await asUser(db, alice, async () => {
      const own = await db.query('select id, status, created_at, qualified_at, consumed_at, reward_id from referrals')
      assert.equal(own.rows.length, 2, 'seules les lignes où alice est parrain sont visibles')
      const rewards = await db.query('select id, sequence, months from referral_rewards')
      assert.equal(rewards.rows.length, 1)

      await rejectsWith(db.query('select referred_id from referrals'), /permission denied/)
      await rejectsWith(db.query('select referred_email_hash from referrals'), /permission denied/)
      await rejectsWith(db.query('select * from referrals'), /permission denied/)
      await rejectsWith(
        db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [alice, carol, hash('e')]),
        /permission denied/,
      )
      await rejectsWith(db.query(`update referrals set status = 'qualified'`), /permission denied/)
      await rejectsWith(db.query('delete from referrals'), /permission denied/)
      await rejectsWith(db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 2)`, [alice]), /permission denied/)
      await rejectsWith(db.query('delete from referral_rewards'), /permission denied/)
    })

    await asUser(db, bob, async () => {
      const visible = await db.query('select id from referrals')
      assert.equal(visible.rows.length, 0, 'un filleul ne voit pas la ligne qui le concerne')
    })

    await db.exec('set role anon')
    await rejectsWith(db.query('select id from referrals'), /permission denied/)
    await rejectsWith(db.query('select id from referral_rewards'), /permission denied/)
    await db.exec('reset role')
  } finally {
    await db.close()
  }
})

test('les contraintes portent les garanties structurelles', async () => {
  const db = await database()
  try {
    for (const [id, email] of [[alice, 'alice@test.fr'], [bob, 'bob@test.fr'], [carol, 'carol@test.fr']]) {
      await signUp(db, id, email)
    }
    await db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [alice, bob, hash('b')])

    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [carol, bob, hash('f')]),
      /referrals_referred_id_key/,
    )
    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [carol, alice, hash('b')]),
      /referrals_referred_email_hash_key/,
    )
    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $1, $2)`, [carol, hash('c')]),
      /referrals_no_self_referral/,
    )
    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, 'not-a-hash')`, [carol, alice]),
      /referred_email_hash_check/,
    )
    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash, status) values ($1, $2, $3, 'qualified')`, [carol, alice, hash('9')]),
      /referrals_state_consistent/,
    )
    await rejectsWith(
      db.query(`update referrals set status = 'qualified', qualified_at = now(), consumed_at = now() where referred_id = $1`, [bob]),
      /referrals_state_consistent/,
    )

    await db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 1), ($1, 2), ($1, 3)`, [alice])
    await rejectsWith(db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 2)`, [alice]), /referral_rewards_referrer_sequence_key/)
    await rejectsWith(db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 4)`, [alice]), /referral_rewards_sequence_check/)
    await rejectsWith(db.query(`insert into referral_rewards (referrer_id, sequence, months) values ($1, 1, 2)`, [carol]), /referral_rewards_months_check/)
  } finally {
    await db.close()
  }
})

test('suppression : le filleul laisse un historique et son email reste bloqué, le parrain emporte ses lignes', async () => {
  const db = await database()
  try {
    for (const [id, email] of [[alice, 'alice@test.fr'], [bob, 'bob@test.fr'], [carol, 'carol@test.fr'], [dave, 'dave@test.fr']]) {
      await signUp(db, id, email)
    }
    const { rows: [reward] } = await db.query(`insert into referral_rewards (referrer_id, sequence) values ($1, 1) returning id`, [alice])
    await db.query(`
      insert into referrals (referrer_id, referred_id, referred_email_hash, status, qualified_at, consumed_at, reward_id)
      values ($1, $2, $3, 'qualified', now(), now(), $4)`, [alice, bob, hash('b'), reward.id])

    await db.query('delete from auth.users where id = $1', [bob])
    const { rows: [orphan] } = await db.query('select referred_id, referred_email_hash, reward_id from referrals')
    assert.equal(orphan.referred_id, null)
    assert.equal(orphan.referred_email_hash, hash('b'))
    assert.equal(orphan.reward_id, reward.id, 'la récompense déjà accordée reste liée')

    await signUp(db, bob, 'bob@test.fr')
    await rejectsWith(
      db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [carol, bob, hash('b')]),
      /referrals_referred_email_hash_key/,
    )

    await db.query(`insert into referrals (referrer_id, referred_id, referred_email_hash) values ($1, $2, $3)`, [alice, dave, hash('d')])
    await db.query('delete from auth.users where id = $1', [alice])
    const { rows: [counts] } = await db.query(`
      select (select count(*)::int from referrals) as referrals, (select count(*)::int from referral_rewards) as rewards`)
    assert.deepEqual(counts, { referrals: 0, rewards: 0 })
  } finally {
    await db.close()
  }
})
