import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

async function database() {
  const db = new PGlite()
  await db.exec(`
    create schema auth;
    create role authenticated;
    create table public.profiles (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `)
  const migrations = [
    '../supabase/migrations/024_tage_mage_diagnostic.sql',
    '../supabase/migrations/025_tage_mage_question_snapshots.sql',
  ]
  for (const migrationPath of migrations) {
    await db.exec(await readFile(new URL(migrationPath, import.meta.url), 'utf8'))
  }
  return db
}

test('la migration TAGE MAGE crée les tables et leurs contraintes', async () => {
  const db = await database()
  try {
    const userId = '11111111-1111-4111-8111-111111111111'
    await db.query('insert into public.profiles (id) values ($1)', [userId])
    await db.query(
      'insert into public.tage_mage_goals (user_id, target_score, weekly_minutes, exam_date) values ($1, 350, 180, $2)',
      [userId, '2026-12-01'],
    )

    await assert.rejects(
      db.query(
        'insert into public.tage_mage_goals (user_id, target_score, weekly_minutes, exam_date) values ($1, 601, 180, $2)',
        ['22222222-2222-4222-8222-222222222222', '2026-12-01'],
      ),
    )
  } finally {
    await db.close()
  }
})

test('les tentatives sont lisibles par leur propriétaire mais non insérables via RLS', async () => {
  const db = await database()
  try {
    const { rows } = await db.query(`
      select cmd, policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'tage_mage_diagnostic_attempts'
      order by cmd
    `)

    assert.deepEqual(rows.map((row) => row.cmd), ['SELECT'])
    assert.match(String(rows[0].policyname), /view own/i)
  } finally {
    await db.close()
  }
})

test('une tentative exige un snapshot JSON des questions', async () => {
  const db = await database()
  try {
    const userId = '33333333-3333-4333-8333-333333333333'
    await db.query('insert into public.profiles (id) values ($1)', [userId])

    await assert.rejects(
      db.query(
        `insert into public.tage_mage_diagnostic_attempts
          (user_id, content_version, answers, section_results, correct_count, total_questions, duration_seconds)
         values ($1, 1, '[]'::jsonb, '{}'::jsonb, 0, 24, 0)`,
        [userId],
      ),
    )

    const snapshot = [{ id: 'tm-calcul-01', prompt: 'Question conservée' }]
    const submissionId = '55555555-5555-4555-8555-555555555555'
    const { rows } = await db.query(
      `insert into public.tage_mage_diagnostic_attempts
        (user_id, submission_id, content_version, question_snapshot, answers, section_results, correct_count, total_questions, duration_seconds)
       values ($1, $2, 1, $3::jsonb, '[]'::jsonb, '{}'::jsonb, 0, 24, 0)
       returning question_snapshot`,
      [userId, submissionId, JSON.stringify(snapshot)],
    )

    assert.deepEqual(rows[0].question_snapshot, snapshot)
    await assert.rejects(db.query(
      `insert into public.tage_mage_diagnostic_attempts
        (user_id, submission_id, content_version, question_snapshot, answers, section_results, correct_count, total_questions, duration_seconds)
       values ($1, $2, 1, $3::jsonb, '[]'::jsonb, '{}'::jsonb, 0, 24, 0)`,
      [userId, submissionId, JSON.stringify(snapshot)],
    ))
  } finally {
    await db.close()
  }
})

test('la migration de snapshot rétroalimente les tentatives de contenu v1', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create schema auth;
      create role authenticated;
      create table public.profiles (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/024_tage_mage_diagnostic.sql', import.meta.url), 'utf8'))

    const userId = '44444444-4444-4444-8444-444444444444'
    await db.query('insert into public.profiles (id) values ($1)', [userId])
    await db.query(
      `insert into public.tage_mage_diagnostic_attempts
        (user_id, content_version, answers, section_results, correct_count, total_questions, duration_seconds)
       values ($1, 1, '[]'::jsonb, '{}'::jsonb, 0, 24, 0)`,
      [userId],
    )

    await db.exec(await readFile(new URL('../supabase/migrations/025_tage_mage_question_snapshots.sql', import.meta.url), 'utf8'))
    const { rows } = await db.query('select question_snapshot from public.tage_mage_diagnostic_attempts where user_id = $1', [userId])

    assert.equal(Array.isArray(rows[0].question_snapshot), true)
    assert.equal(rows[0].question_snapshot.length, 24)
    assert.equal(rows[0].question_snapshot[0].contentVersion, 1)
    assert.equal(typeof rows[0].question_snapshot[0].correctIndex, 'number')
  } finally {
    await db.close()
  }
})
