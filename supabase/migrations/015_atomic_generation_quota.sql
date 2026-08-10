-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015 : Consommation atomique du quota de génération
--
-- Les routes de génération faisaient un read-modify-write non atomique :
--   1. select generations_used_this_month
--   2. comparaison au quota en JS
--   3. update ... = valeur_lue + 1
--
-- Quand le panneau « générer aussi » lance N requêtes en parallèle, les N
-- lectures renvoient la même valeur et les N écritures posent la même valeur
-- incrémentée : N générations ne consomment qu'un seul crédit, et un compte
-- gratuit à 4/5 peut dépasser son quota en lançant plusieurs requêtes d'un
-- coup.
--
-- Cette fonction fait reset mensuel, vérification et incrément dans une seule
-- instruction, sous verrou de ligne, ce qui sérialise les appels concurrents.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.consume_generation_credit(
  p_user_id uuid,
  p_free_quota integer default 5
)
returns table (
  allowed   boolean,
  used      integer,
  is_pro    boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan     text;
  v_used     integer;
  v_reset_at timestamptz;
  v_is_pro   boolean;
begin
  -- Verrou de ligne : les appels concurrents pour le même utilisateur
  -- s'exécutent l'un après l'autre au lieu de lire la même valeur.
  select p.plan, p.generations_used_this_month, p.generations_reset_at
    into v_plan, v_used, v_reset_at
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
end;
$$;

revoke all on function public.consume_generation_credit(uuid, integer) from public;
grant execute on function public.consume_generation_credit(uuid, integer) to service_role;

-- Rendre un crédit lorsqu'une génération échoue après avoir été débitée.
create or replace function public.refund_generation_credit(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
    set generations_used_this_month = greatest(0, generations_used_this_month - 1)
  where id = p_user_id;
$$;

revoke all on function public.refund_generation_credit(uuid) from public;
grant execute on function public.refund_generation_credit(uuid) to service_role;
