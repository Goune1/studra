-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 023 : Parrainage utilisateur — qualification et octroi
--
-- referral_qualify(filleul) est appelée côté serveur après chaque génération
-- réussie (les 9 routes qui consomment un crédit). L'appelant atteste la
-- génération ; la fonction vérifie l'email confirmé (aujourd'hui toujours vrai,
-- la confirmation étant désactivée, mais utile si elle est activée un jour).
--
-- Idempotence et concurrence, dans une seule transaction :
--   1. pending -> qualified par un UPDATE ... WHERE status = 'pending' : deux
--      générations simultanées du même filleul se sérialisent sur le verrou de
--      ligne, la seconde réévalue la condition et ne modifie rien.
--   2. Le profil du parrain est verrouillé (FOR UPDATE) avant tout calcul de
--      récompense : les qualifications simultanées de filleuls différents d'un
--      même parrain s'exécutent l'une après l'autre, chacune voyant les
--      consommations validées par la précédente.
--   3. Garantie structurelle (020) : unique (referrer_id, sequence) avec
--      sequence entre 1 et 3, et un seul reward_id par filleul. Un mois ne peut
--      pas être accordé deux fois ni un 4e mois, même si le verrou était
--      contourné.
--
-- Récompense : chaque tranche de 2 filleuls qualifiés non consommés donne 1 mois,
-- pro_until = max(now(), pro_until) + 1 mois, plafond 3 mois. Au-delà, les
-- filleuls restent qualifiés sans être consommés.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.referral_qualify(p_referred_id uuid)
returns table (
  referral_id     uuid,
  referrer_id     uuid,
  qualified_count integer,
  reward_id       uuid,
  reward_sequence smallint,
  pro_until       timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_referral  public.referrals%rowtype;
  v_granted   integer;
  v_batch     uuid[];
  v_reward_id uuid;
  v_sequence  smallint;
  v_pro_until timestamptz;
begin
  update public.referrals r
     set status = 'qualified',
         qualified_at = now()
   where r.referred_id = p_referred_id
     and r.status = 'pending'
     and exists (
       select 1 from auth.users u
       where u.id = p_referred_id and u.email_confirmed_at is not null
     )
  returning r.* into v_referral;

  if not found then
    return;
  end if;

  perform 1 from public.profiles p where p.id = v_referral.referrer_id for update;

  select count(*) into v_granted
  from public.referral_rewards rw
  where rw.referrer_id = v_referral.referrer_id;

  if v_granted < 3 then
    select array_agg(batch.id) into v_batch
    from (
      select r.id
      from public.referrals r
      where r.referrer_id = v_referral.referrer_id
        and r.status = 'qualified'
        and r.consumed_at is null
      order by r.qualified_at, r.id
      limit 2
      for update
    ) batch;

    if coalesce(cardinality(v_batch), 0) = 2 then
      v_sequence := v_granted + 1;

      insert into public.referral_rewards as rw (referrer_id, sequence, months)
      values (v_referral.referrer_id, v_sequence, 1)
      returning rw.id into v_reward_id;

      update public.referrals r
         set consumed_at = now(),
             reward_id = v_reward_id
       where r.id = any(v_batch);

      update public.profiles p
         set pro_until = greatest(now(), p.pro_until) + interval '1 month'
       where p.id = v_referral.referrer_id
      returning p.pro_until into v_pro_until;
    end if;
  end if;

  return query
    select v_referral.id,
           v_referral.referrer_id,
           (select count(*)::integer from public.referrals r
             where r.referrer_id = v_referral.referrer_id and r.status = 'qualified'),
           v_reward_id,
           v_sequence,
           v_pro_until;
end;
$$;

revoke all on function public.referral_qualify(uuid) from public, anon, authenticated;
grant execute on function public.referral_qualify(uuid) to service_role;
