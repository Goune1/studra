-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 020 : Parrainage utilisateur — schéma
--
-- 2 filleuls qualifiés = 1 mois de Pro offert (plafond 3 mois), matérialisé
-- par profiles.pro_until, sans passer par Stripe.
--
-- Cette migration ne pose que le schéma : colonnes, backfill des codes,
-- tables, RLS et garde des nouvelles colonnes. Aucun code applicatif ne les
-- lit encore et pro_until reste NULL partout : aucun changement de
-- comportement. La résolution du plan (is_pro) arrive en 021, l'attribution
-- et la qualification en 022.
--
-- Base : définitions déployées relevées le 2026-09-14 (Phase 0), notamment
-- prevent_profile_privilege_escalation dans sa version 019.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Colonnes profiles ────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists pro_until timestamptz;

-- ── Code de parrainage ───────────────────────────────────────────────────────
-- 8 caractères sans 0 O 1 I L. random() suffit : le code est un identifiant
-- public, pas un secret. Un code affilié historique fait 8 caractères : on
-- exclut toute collision insensible à la casse pour que ?ref= reste univoque.
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * 31)::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code)
          and not exists (select 1 from public.affiliates where upper(referral_code) = v_code);
  end loop;
  return v_code;
end;
$$;

revoke all on function public.generate_referral_code() from public, anon, authenticated;
grant execute on function public.generate_referral_code() to service_role;

-- Backfill ligne par ligne : chaque update voit les codes déjà attribués.
-- La garde de profil (version 019) ne couvre pas referral_code : l'update
-- passe, et la garde est étendue plus bas seulement.
do $$
declare r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public.generate_referral_code() where id = r.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column referral_code set default public.generate_referral_code(),
  alter column referral_code set not null,
  add constraint profiles_referral_code_key unique (referral_code),
  add constraint profiles_referral_code_format
    check (referral_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$');

-- ── Récompenses ──────────────────────────────────────────────────────────────
-- (referrer_id, sequence) unique avec sequence ∈ [1, 3] : un même mois ne peut
-- pas être accordé deux fois, et un 4e mois est impossible, même si le verrou
-- applicatif de 022 était contourné.
create table public.referral_rewards (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  sequence    smallint not null check (sequence between 1 and 3),
  months      smallint not null default 1 check (months = 1),
  granted_at  timestamptz not null default now(),
  constraint referral_rewards_referrer_sequence_key unique (referrer_id, sequence)
);

-- ── Filleuls ─────────────────────────────────────────────────────────────────
-- referred_id passe à NULL si le filleul supprime son compte : l'historique et
-- les récompenses déjà accordées restent. referred_email_hash (sha256 hex de
-- l'email normalisé) est unique globalement : un email n'est parrainé qu'une
-- fois, définitivement, quel que soit le parrain.
create table public.referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_id         uuid not null references public.profiles(id) on delete cascade,
  referred_id         uuid references public.profiles(id) on delete set null,
  referred_email_hash text not null check (referred_email_hash ~ '^[0-9a-f]{64}$'),
  status              text not null default 'pending' check (status in ('pending', 'qualified')),
  created_at          timestamptz not null default now(),
  qualified_at        timestamptz,
  consumed_at         timestamptz,
  reward_id           uuid references public.referral_rewards(id),
  constraint referrals_referred_id_key unique (referred_id),
  constraint referrals_no_self_referral check (referrer_id <> referred_id),
  constraint referrals_state_consistent check (
    (status = 'pending' and qualified_at is null and consumed_at is null and reward_id is null)
    or (status = 'qualified' and qualified_at is not null and (consumed_at is null) = (reward_id is null))
  )
);

create unique index referrals_referred_email_hash_key on public.referrals (referred_email_hash);
create index referrals_referrer_status_idx on public.referrals (referrer_id, status, qualified_at);
create index referrals_reward_idx on public.referrals (reward_id) where reward_id is not null;
create index referral_rewards_referrer_idx on public.referral_rewards (referrer_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Lecture de ses propres lignes de parrain uniquement. Aucune écriture client :
-- tout passe par les RPC service_role de 022. referred_id et
-- referred_email_hash ne sont jamais lisibles par le parrain.
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

revoke all on public.referrals from anon, authenticated;
revoke all on public.referral_rewards from anon, authenticated;

grant select (id, referrer_id, status, created_at, qualified_at, consumed_at, reward_id)
  on public.referrals to authenticated;
grant select on public.referral_rewards to authenticated;

create policy "Referrers can view own referrals"
  on public.referrals for select to authenticated
  using (auth.uid() = referrer_id);

create policy "Referrers can view own rewards"
  on public.referral_rewards for select to authenticated
  using (auth.uid() = referrer_id);

-- ── Garde des colonnes serveur ───────────────────────────────────────────────
-- Version 019 déployée + referral_code et pro_until. Sans cela, la policy
-- « Users can update own profile » permettrait à un utilisateur de s'offrir
-- pro_until depuis le navigateur.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
begin
  if new.plan is distinct from old.plan
     or new.pro_until is distinct from old.pro_until
     or new.referral_code is distinct from old.referral_code
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
      raise exception 'Permission denied: cannot modify server-managed columns'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_profile_privilege_escalation() from public, anon, authenticated;
