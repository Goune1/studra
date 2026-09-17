-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 022 : Parrainage utilisateur — attribution
--
-- Appelée côté serveur (service_role) juste après la création d'un compte,
-- email ou OAuth, quand le cookie de parrainage posé par le proxy est présent.
-- Toutes les règles d'attribution vivent ici :
--   - code au format exact, parrain existant et non banni (les comptes
--     anonymisés par deleteAccount sont bannis) ;
--   - nouvel utilisateur uniquement : profil créé depuis moins d'une heure
--     (le callback OAuth s'exécute aussi à chaque connexion d'un compte existant) ;
--   - auto-parrainage refusé : même utilisateur ou email normalisé identique ;
--   - un filleul et un email ne sont attribués qu'une fois, jamais réattribués
--     (contraintes uniques de 020, insertion en `on conflict do nothing`).
-- La qualification et l'octroi arrivent en 023.
-- ─────────────────────────────────────────────────────────────────────────────

-- Minuscules ; pour gmail.com / googlemail.com, retrait des points et du
-- suffixe +tag de la partie locale, domaine ramené à gmail.com.
create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when split_part(lower(btrim(p_email)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(btrim(p_email)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else lower(btrim(p_email))
  end
$$;

create or replace function public.referral_email_hash(p_email text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(sha256(convert_to(public.normalize_email(p_email), 'UTF8')), 'hex')
$$;

create or replace function public.referral_attribute(p_referral_code text, p_referred_id uuid)
returns table (referral_id uuid, referrer_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred public.profiles%rowtype;
  v_referrer public.profiles%rowtype;
begin
  if p_referral_code is null or p_referral_code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$' then
    return;
  end if;

  select * into v_referred from public.profiles where id = p_referred_id;
  if not found or v_referred.created_at < now() - interval '1 hour' then
    return;
  end if;

  select p.* into v_referrer
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.referral_code = p_referral_code
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= now());
  if not found or v_referrer.id = v_referred.id then
    return;
  end if;

  if public.normalize_email(v_referrer.email) = public.normalize_email(v_referred.email) then
    return;
  end if;

  return query
    insert into public.referrals as r (referrer_id, referred_id, referred_email_hash)
    values (v_referrer.id, v_referred.id, public.referral_email_hash(v_referred.email))
    on conflict do nothing
    returning r.id, r.referrer_id;
end;
$$;

revoke all on function public.normalize_email(text) from public, anon, authenticated;
revoke all on function public.referral_email_hash(text) from public, anon, authenticated;
revoke all on function public.referral_attribute(text, uuid) from public, anon, authenticated;
grant execute on function public.normalize_email(text) to service_role;
grant execute on function public.referral_email_hash(text) to service_role;
grant execute on function public.referral_attribute(text, uuid) to service_role;
