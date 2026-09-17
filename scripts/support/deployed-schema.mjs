import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

// Reproduction de l'état Supabase déployé, relevé le 2026-09-14 (Phase 0) :
// colonnes réelles de profiles, handle_new_user, policies de profiles, garde
// de profil en version 019, consume/refund_generation_credit, et les tables de
// contenu avec leurs policies (dont les 5 « Pro users can view public ... »).
// Les tests SQL du parrainage appliquent ensuite 020, 021, ... par-dessus.
const DEPLOYED_SCHEMA = `
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create table auth.users (
    id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
    email_confirmed_at timestamptz, banned_until timestamptz, deleted_at timestamptz
  );

  create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text not null,
    full_name text,
    plan text not null default 'free' check (plan in ('free', 'pro')),
    generations_used_this_month int not null default 0,
    generations_reset_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    stripe_customer_id text,
    stripe_subscription_id text,
    marketing_consent boolean not null default false,
    preferred_locale text,
    stripe_subscription_event_at timestamptz,
    stripe_subscription_created_at timestamptz,
    stripe_current_period_end timestamptz,
    subscription_cancel_at_period_end boolean not null default false,
    updated_at timestamptz not null default now()
  );
  alter table public.profiles enable row level security;
  create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

  create table public.affiliates (id uuid primary key default gen_random_uuid(), referral_code text not null unique);

  create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;
    return new;
  end $$;
  create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

  create function public.prevent_profile_privilege_escalation() returns trigger language plpgsql security definer set search_path = public as $$
  declare
    claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  begin
    if new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_subscription_event_at is distinct from old.stripe_subscription_event_at
       or new.stripe_subscription_created_at is distinct from old.stripe_subscription_created_at
       or new.stripe_current_period_end is distinct from old.stripe_current_period_end
       or new.subscription_cancel_at_period_end is distinct from old.subscription_cancel_at_period_end
       or new.generations_used_this_month is distinct from old.generations_used_this_month
       or new.generations_reset_at is distinct from old.generations_reset_at
    then
      if coalesce(claims ->> 'role', '') <> 'service_role' then
        raise exception 'Permission denied: cannot modify server-managed columns' using errcode = '42501';
      end if;
    end if;
    return new;
  end $$;
  create trigger prevent_profile_privilege_escalation before update on public.profiles
    for each row execute function public.prevent_profile_privilege_escalation();

  create function public.consume_generation_credit(p_user_id uuid, p_free_quota integer default 5)
  returns table(allowed boolean, used integer, is_pro boolean)
  language plpgsql security definer set search_path = public as $$
  declare
    v_plan     text;
    v_used     integer;
    v_reset_at timestamptz;
    v_is_pro   boolean;
  begin
    select p.plan, p.generations_used_this_month, p.generations_reset_at
      into v_plan, v_used, v_reset_at
    from public.profiles p
    where p.id = p_user_id
    for update;

    if not found then
      return query select false, 0, false;
      return;
    end if;

    if v_reset_at is null or date_trunc('month', v_reset_at) < date_trunc('month', now()) then
      v_used := 0;
      update public.profiles
        set generations_used_this_month = 0,
            generations_reset_at = now()
      where id = p_user_id;
    end if;

    v_is_pro := v_plan = 'pro';

    if not v_is_pro and v_used >= p_free_quota then
      return query select false, v_used, v_is_pro;
      return;
    end if;

    update public.profiles
      set generations_used_this_month = generations_used_this_month + 1
    where id = p_user_id
    returning generations_used_this_month into v_used;

    return query select true, v_used, v_is_pro;
  end $$;
  revoke all on function public.consume_generation_credit(uuid, integer) from public;
  grant execute on function public.consume_generation_credit(uuid, integer) to service_role;

  create table public.decks (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade not null, title text not null, is_public boolean not null default false);
  create table public.flashcards (id uuid primary key default gen_random_uuid(), deck_id uuid references public.decks(id) on delete cascade not null, question text not null);
  create table public.fiches (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade not null, title text not null, is_public boolean not null default false);
  create table public.schemas (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade not null, title text not null, is_public boolean not null default false);
  create table public.timelines (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade not null, title text not null, is_public boolean not null default false);
  alter table public.decks enable row level security;
  alter table public.flashcards enable row level security;
  alter table public.fiches enable row level security;
  alter table public.schemas enable row level security;
  alter table public.timelines enable row level security;
  create policy "Users can CRUD own decks" on public.decks for all using (auth.uid() = user_id);
  create policy "Users can CRUD own flashcards" on public.flashcards for all using (deck_id in (select id from public.decks where user_id = auth.uid()));
  create policy "Users can CRUD own fiches" on public.fiches for all using (auth.uid() = user_id);
  create policy "Users can CRUD own schemas" on public.schemas for all using (auth.uid() = user_id);
  create policy "Users can CRUD own timelines" on public.timelines for all using (auth.uid() = user_id);
  create policy "Pro users can view public decks" on public.decks for select using (
    is_public = true and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.plan = 'pro'));
  create policy "Pro users can view public fiches" on public.fiches for select using (
    is_public = true and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.plan = 'pro'));
  create policy "Pro users can view public schemas" on public.schemas for select using (
    is_public = true and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.plan = 'pro'));
  create policy "Pro users can view public timelines" on public.timelines for select using (
    is_public = true and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.plan = 'pro'));
  create policy "Pro users can view public flashcards" on public.flashcards for select using (
    deck_id in (select decks.id from decks where decks.is_public = true)
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.plan = 'pro'));

  -- Privilèges par défaut de Supabase relevés en production : tout est accordé
  -- à anon et authenticated, la RLS fait le filtrage.
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant all on public.profiles, public.decks, public.flashcards, public.fiches, public.schemas, public.timelines to anon, authenticated;
  grant all on all tables in schema public to service_role;
`

export async function createDeployedDatabase({ seedUsers = [] } = {}) {
  const db = new PGlite()
  await db.exec(DEPLOYED_SCHEMA)
  for (const [id, email] of seedUsers) await signUp(db, id, email)
  return db
}

export async function applyMigration(db, file) {
  await db.exec(await readFile(join(process.cwd(), 'supabase/migrations', file), 'utf8'))
}

export async function signUp(db, id, email) {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email])
}

export async function asUser(db, userId, fn) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [
    userId,
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ])
  await db.exec('set role authenticated')
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)`)
  }
}

export async function asAnon(db, fn) {
  await db.exec('set role anon')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

export async function asServiceRole(db, fn) {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ role: 'service_role' })])
  await db.exec('set role service_role')
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false)`)
  }
}

export async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(String(error.message), pattern)
    return true
  })
}
