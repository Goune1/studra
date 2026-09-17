-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 021 : Règle unique « utilisateur Pro »
--
-- Un utilisateur est Pro si son abonnement Stripe est actif (plan = 'pro',
-- écrit uniquement par le webhook) OU si un Pro offert court encore
-- (pro_until > now()). Cette règle n'existe qu'ici, dans public.is_pro :
--   - PostgREST l'expose comme champ calculé (select=is_pro), lu par
--     src/lib/plan.ts, seul point d'entrée TypeScript ;
--   - consume_generation_credit et les 5 policies « Pro users can view
--     public ... » l'appellent au lieu de tester plan = 'pro'.
--
-- pro_until vaut NULL pour tous les profils à l'application : is_pro(p)
-- équivaut alors exactement à plan = 'pro', le comportement est inchangé.
--
-- Base : définitions déployées relevées le 2026-09-14 (Phase 0).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.is_pro(p public.profiles)
returns boolean
language sql
stable
set search_path = public
as $$
  select p.plan = 'pro' or coalesce(p.pro_until > now(), false)
$$;

-- Évaluée dans les policies pour tout rôle qui lit decks/fiches/... (y compris
-- anon) : l'exécution doit rester ouverte. Elle ne lit que la ligne reçue.
revoke all on function public.is_pro(public.profiles) from public;
grant execute on function public.is_pro(public.profiles) to anon, authenticated, service_role;

-- ── Quota ────────────────────────────────────────────────────────────────────
-- Définition déployée, seule la détermination de v_is_pro change.
create or replace function public.consume_generation_credit(p_user_id uuid, p_free_quota integer default 5)
returns table(allowed boolean, used integer, is_pro boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used     integer;
  v_reset_at timestamptz;
  v_is_pro   boolean;
begin
  -- Verrou de ligne : les appels concurrents pour le même utilisateur
  -- s'exécutent l'un après l'autre au lieu de lire la même valeur.
  select public.is_pro(p), p.generations_used_this_month, p.generations_reset_at
    into v_is_pro, v_used, v_reset_at
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    return query select false, 0, false;
    return;
  end if;

  -- Reset mensuel calendaire, aligné sur le comportement applicatif précédent.
  if v_reset_at is null or date_trunc('month', v_reset_at) < date_trunc('month', now()) then
    v_used := 0;
    update public.profiles
      set generations_used_this_month = 0,
          generations_reset_at = now()
    where id = p_user_id;
  end if;

  if not v_is_pro and v_used >= p_free_quota then
    return query select false, v_used, v_is_pro;
    return;
  end if;

  update public.profiles
    set generations_used_this_month = generations_used_this_month + 1
  where id = p_user_id
  returning generations_used_this_month into v_used;

  return query select true, v_used, v_is_pro;
end;
$$;

revoke all on function public.consume_generation_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_generation_credit(uuid, integer) to service_role;

-- ── Policies de lecture du contenu public ────────────────────────────────────
-- Recréées à l'identique (PERMISSIVE, rôle public, SELECT), seul le test Pro
-- change.
drop policy if exists "Pro users can view public decks" on public.decks;
create policy "Pro users can view public decks" on public.decks for select using (
  is_public = true
  and exists (select 1 from public.profiles p where p.id = auth.uid() and public.is_pro(p))
);

drop policy if exists "Pro users can view public fiches" on public.fiches;
create policy "Pro users can view public fiches" on public.fiches for select using (
  is_public = true
  and exists (select 1 from public.profiles p where p.id = auth.uid() and public.is_pro(p))
);

drop policy if exists "Pro users can view public schemas" on public.schemas;
create policy "Pro users can view public schemas" on public.schemas for select using (
  is_public = true
  and exists (select 1 from public.profiles p where p.id = auth.uid() and public.is_pro(p))
);

drop policy if exists "Pro users can view public timelines" on public.timelines;
create policy "Pro users can view public timelines" on public.timelines for select using (
  is_public = true
  and exists (select 1 from public.profiles p where p.id = auth.uid() and public.is_pro(p))
);

drop policy if exists "Pro users can view public flashcards" on public.flashcards;
create policy "Pro users can view public flashcards" on public.flashcards for select using (
  deck_id in (select id from public.decks where is_public = true)
  and exists (select 1 from public.profiles p where p.id = auth.uid() and public.is_pro(p))
);

-- Rend le champ calculé is_pro visible par PostgREST sans attendre.
notify pgrst, 'reload schema';
