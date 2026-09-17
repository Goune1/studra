-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 019 : Droits d'exécution des RPC et garde des colonnes Stripe
--
-- Sur Supabase, les privilèges par défaut du schéma public accordent EXECUTE
-- à anon et authenticated sur chaque nouvelle fonction. Un
-- `revoke all ... from public` ne retire donc pas ces droits explicites :
-- consume_generation_credit et refund_generation_credit (015) étaient
-- appelables depuis le navigateur avec la clé anon, ce qui permettait de
-- remettre son compteur de générations à zéro ou de vider celui d'un autre.
--
-- Les colonnes d'état Stripe ajoutées par 016 ne sont écrites que par le
-- webhook (service_role) : on les ajoute à la garde de 011 pour qu'un
-- utilisateur ne puisse pas les modifier via la policy update de profiles.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on function public.consume_generation_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_generation_credit(uuid, integer) to service_role;

revoke all on function public.refund_generation_credit(uuid) from public, anon, authenticated;
grant execute on function public.refund_generation_credit(uuid) to service_role;

-- Appelée uniquement par le client service_role (src/lib/rate-limit.ts).
revoke all on function public.check_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;

revoke all on function public.purge_rate_limits() from public, anon, authenticated;
grant execute on function public.purge_rate_limits() to service_role;

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
