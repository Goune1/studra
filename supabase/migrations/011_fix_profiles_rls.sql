-- V-01: prevent authenticated users from escalating profile privileges.
-- Validation: after applying, `sb.from('profiles').update({plan:'pro'}).eq('id', userId)`
-- must return code `42501`. Test from the browser while signed in as a free user.

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;

create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();
