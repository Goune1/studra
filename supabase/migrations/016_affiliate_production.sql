-- Affiliate production hardening.
-- This migration keeps the legacy euro columns for backward-compatible reads,
-- but all new financial mutations use integer minor units through locked RPCs.

alter table public.profiles
  add column if not exists stripe_subscription_event_at timestamptz,
  add column if not exists stripe_subscription_created_at timestamptz;

alter table public.affiliate_settings
  add column if not exists minimum_payout_minor bigint,
  add column if not exists commission_hold_days integer not null default 30,
  add column if not exists affiliate_terms_version text not null default '2026-08-11';

update public.affiliate_settings
set minimum_payout_minor = round(minimum_payout_threshold * 100)::bigint
where minimum_payout_minor is null;

alter table public.affiliate_settings
  alter column minimum_payout_minor set not null;

alter table public.affiliate_settings
  add constraint affiliate_settings_threshold_positive check (minimum_payout_minor > 0),
  add constraint affiliate_settings_rate_bounded check (default_commission_rate between 0 and 100),
  add constraint affiliate_settings_hold_bounded check (commission_hold_days between 0 and 180);

alter table public.affiliates
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

update public.affiliates
set terms_version = 'legacy', terms_accepted_at = created_at
where terms_version is null;

alter table public.affiliates
  alter column terms_version set not null,
  alter column terms_accepted_at set not null,
  add constraint affiliates_commission_rate_bounded check (commission_rate between 0 and 100),
  add constraint affiliates_payment_details_consistent check (
    (payment_method = 'paypal' and paypal_email is not null and iban is null and bic is null and account_holder_name is null)
    or
    (payment_method = 'bank_transfer' and paypal_email is null and iban is not null and account_holder_name is not null)
  ) not valid;

alter table public.affiliate_clicks
  add column if not exists dedupe_key text;
create unique index if not exists affiliate_clicks_dedupe_key_key
  on public.affiliate_clicks(dedupe_key) where dedupe_key is not null;
create index if not exists affiliate_clicks_affiliate_created_idx
  on public.affiliate_clicks(affiliate_id, created_at desc);

alter table public.affiliate_referrals
  add column if not exists status text not null default 'pending',
  add column if not exists qualified_at timestamptz,
  add column if not exists attribution_expires_at timestamptz,
  add column if not exists referral_code_snapshot text;

update public.affiliate_referrals
set status = 'qualified', qualified_at = created_at
where status = 'pending';

alter table public.affiliate_referrals
  add constraint affiliate_referrals_status_valid check (status in ('pending', 'qualified', 'rejected')),
  add constraint affiliate_referrals_qualification_consistent check (
    (status = 'qualified' and qualified_at is not null) or status <> 'qualified'
  );

alter table public.affiliate_commissions
  add column if not exists entry_type text not null default 'commission',
  add column if not exists source_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists stripe_dispute_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists currency text,
  add column if not exists amount_revenue_minor bigint,
  add column if not exists amount_commission_minor bigint,
  add column if not exists rate_bps integer,
  add column if not exists available_at timestamptz,
  add column if not exists parent_commission_id uuid references public.affiliate_commissions(id) on delete restrict,
  add column if not exists reason text;

update public.affiliate_commissions
set source_id = coalesce(source_id, 'invoice:' || stripe_invoice_id),
    currency = coalesce(currency, 'eur'),
    amount_revenue_minor = coalesce(amount_revenue_minor, round(amount_revenue * 100)::bigint),
    amount_commission_minor = coalesce(amount_commission_minor, round(amount_commission * 100)::bigint),
    rate_bps = coalesce(rate_bps, case when amount_revenue > 0 then round(amount_commission / amount_revenue * 10000)::integer else 0 end),
    available_at = coalesce(available_at, created_at + interval '30 days');

alter table public.affiliate_commissions
  alter column source_id set not null,
  alter column currency set not null,
  alter column amount_revenue_minor set not null,
  alter column amount_commission_minor set not null,
  alter column rate_bps set not null,
  alter column available_at set not null,
  add constraint affiliate_commissions_entry_type_valid check (entry_type in ('commission', 'refund', 'dispute', 'manual_adjustment')),
  add constraint affiliate_commissions_revenue_sign check (
    (entry_type = 'commission' and amount_revenue_minor >= 0)
    or (entry_type in ('refund', 'dispute') and amount_revenue_minor <= 0)
    or entry_type = 'manual_adjustment'
  ),
  add constraint affiliate_commissions_amount_nonzero check (
    entry_type in ('refund', 'dispute') or amount_commission_minor <> 0
  ) not valid,
  add constraint affiliate_commissions_currency_iso check (currency = lower(currency) and char_length(currency) = 3),
  add constraint affiliate_commissions_rate_bounded check (rate_bps between 0 and 10000),
  add constraint affiliate_commissions_parent_consistent check (
    (entry_type = 'commission' and parent_commission_id is null)
    or (entry_type <> 'commission' and parent_commission_id is not null)
  );

alter table public.affiliate_commissions drop constraint if exists affiliate_commissions_stripe_invoice_id_key;
alter table public.affiliate_commissions alter column stripe_invoice_id drop not null;
create unique index if not exists affiliate_commissions_invoice_commission_key
  on public.affiliate_commissions(stripe_invoice_id)
  where entry_type = 'commission' and stripe_invoice_id is not null;

create unique index if not exists affiliate_commissions_source_id_key
  on public.affiliate_commissions(source_id);
create unique index if not exists affiliate_commissions_stripe_refund_id_key
  on public.affiliate_commissions(stripe_refund_id) where stripe_refund_id is not null;
create unique index if not exists affiliate_commissions_stripe_dispute_id_key
  on public.affiliate_commissions(stripe_dispute_id) where stripe_dispute_id is not null;
create index if not exists affiliate_commissions_payment_intent_idx
  on public.affiliate_commissions(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create index if not exists affiliate_commissions_release_idx
  on public.affiliate_commissions(status, available_at);
create index if not exists affiliate_commissions_affiliate_status_idx
  on public.affiliate_commissions(affiliate_id, status, created_at desc);

alter table public.affiliate_payouts
  add column if not exists amount_minor bigint,
  add column if not exists currency text,
  add column if not exists idempotency_key text,
  add column if not exists initiated_by uuid,
  add column if not exists confirmed_by uuid,
  add column if not exists failure_reason text,
  add column if not exists updated_at timestamptz not null default now();

update public.affiliate_payouts
set amount_minor = coalesce(amount_minor, round(amount * 100)::bigint),
    currency = coalesce(currency, 'eur'),
    idempotency_key = coalesce(idempotency_key, 'legacy:' || id::text),
    failure_reason = case when status = 'pending' then 'Legacy pending payout requires recreation' else failure_reason end,
    status = case when status = 'pending' then 'failed' else status end;

alter table public.affiliate_payouts
  drop constraint if exists affiliate_payouts_status_check;
alter table public.affiliate_payouts
  alter column amount_minor set not null,
  alter column currency set not null,
  alter column idempotency_key set not null,
  add constraint affiliate_payouts_amount_positive check (amount_minor > 0),
  add constraint affiliate_payouts_currency_iso check (currency = lower(currency) and char_length(currency) = 3),
  add constraint affiliate_payouts_status_valid check (status in ('processing', 'paid', 'failed', 'reversed')),
  add constraint affiliate_payouts_paid_consistent check (
    (status = 'paid' and paid_at is not null and payment_reference is not null)
    or (status <> 'paid' and paid_at is null)
  ) not valid;

create unique index if not exists affiliate_payouts_idempotency_key_key
  on public.affiliate_payouts(idempotency_key);
create index if not exists affiliate_payouts_affiliate_status_idx
  on public.affiliate_payouts(affiliate_id, status, created_at desc);

create table if not exists public.affiliate_payout_items (
  payout_id uuid not null references public.affiliate_payouts(id) on delete restrict,
  commission_id uuid not null references public.affiliate_commissions(id) on delete restrict,
  amount_minor bigint not null check (amount_minor <> 0),
  created_at timestamptz not null default now(),
  primary key (payout_id, commission_id),
  unique (commission_id)
);

create table if not exists public.affiliate_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  affiliate_id uuid references public.affiliates(id) on delete restrict,
  payout_id uuid references public.affiliate_payouts(id) on delete restrict,
  commission_id uuid references public.affiliate_commissions(id) on delete restrict,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  processing_started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_pending_adjustments (
  source_id text primary key,
  stripe_payment_intent_id text not null,
  entry_type text not null check (entry_type in ('refund', 'dispute')),
  refund_amount_minor bigint not null check (refund_amount_minor > 0),
  transaction_amount_minor bigint not null check (transaction_amount_minor > 0),
  stripe_refund_id text,
  stripe_dispute_id text,
  reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_pending_dispute_reversals (
  stripe_dispute_id text primary key,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.affiliate_payout_items enable row level security;
alter table public.affiliate_admin_audit_log enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.affiliate_pending_adjustments enable row level security;
alter table public.affiliate_pending_dispute_reversals enable row level security;

-- Remove every direct client mutation path. Sensitive changes now go through
-- narrow RPCs; service_role retains its normal RLS bypass.
drop policy if exists "Affiliates can update own profile" on public.affiliates;
drop policy if exists "Authenticated users can insert own affiliate" on public.affiliates;
drop policy if exists "Affiliates can view own clicks" on public.affiliate_clicks;
drop policy if exists "Affiliates can view own referrals" on public.affiliate_referrals;

revoke insert, update, delete on public.affiliates from authenticated;
revoke all on public.affiliate_clicks from authenticated;
revoke all on public.affiliate_referrals from authenticated;
revoke insert, update, delete on public.affiliate_commissions from authenticated;
revoke insert, update, delete on public.affiliate_payouts from authenticated;
revoke all on public.affiliate_payout_items from authenticated;
revoke all on public.affiliate_admin_audit_log from authenticated;
revoke all on public.stripe_webhook_events from authenticated;
revoke all on public.affiliate_pending_adjustments from authenticated;
revoke all on public.affiliate_pending_dispute_reversals from authenticated;

create or replace function public.register_affiliate(
  p_first_name text,
  p_last_name text,
  p_contact_email text,
  p_payment_method text,
  p_paypal_email text,
  p_iban text,
  p_bic text,
  p_account_holder_name text,
  p_terms_version text
)
returns table (id uuid, referral_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_id uuid;
  v_expected_terms text;
  v_base text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if exists (select 1 from public.affiliates a where a.user_id = v_user_id) then raise exception 'already_registered'; end if;

  select s.affiliate_terms_version into v_expected_terms
  from public.affiliate_settings as s
  where s.id = 1;
  if p_terms_version is distinct from v_expected_terms then raise exception 'terms_version_mismatch'; end if;
  if nullif(btrim(p_first_name), '') is null or char_length(p_first_name) > 100 then raise exception 'invalid_first_name'; end if;
  if nullif(btrim(p_last_name), '') is null or char_length(p_last_name) > 100 then raise exception 'invalid_last_name'; end if;
  if p_contact_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(p_contact_email) > 254 then raise exception 'invalid_email'; end if;
  if p_payment_method not in ('paypal', 'bank_transfer') then raise exception 'invalid_payment_method'; end if;
  if p_payment_method = 'paypal' and (p_paypal_email is null or p_iban is not null or p_account_holder_name is not null) then raise exception 'invalid_payment_details'; end if;
  if p_payment_method = 'bank_transfer' and (p_iban is null or nullif(btrim(p_account_holder_name), '') is null or p_paypal_email is not null) then raise exception 'invalid_payment_details'; end if;
  if p_payment_method = 'paypal' and p_paypal_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_paypal_email'; end if;
  if p_payment_method = 'bank_transfer' and upper(regexp_replace(p_iban, '\s', '', 'g')) !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$' then raise exception 'invalid_iban'; end if;
  if p_bic is not null and p_bic <> '' and upper(p_bic) !~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$' then raise exception 'invalid_bic'; end if;

  v_base := left(regexp_replace(lower(p_first_name), '[^a-z0-9]', '', 'g'), 8);
  if v_base = '' then v_base := 'user'; end if;
  loop
    v_code := v_base || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.affiliates a where a.referral_code = v_code);
  end loop;

  insert into public.affiliates (
    user_id, referral_code, commission_rate, status, first_name, last_name,
    contact_email, payment_method, paypal_email, iban, bic,
    account_holder_name, terms_version, terms_accepted_at
  )
  select v_user_id, v_code, s.default_commission_rate, 'active', btrim(p_first_name), btrim(p_last_name),
    lower(btrim(p_contact_email)), p_payment_method, lower(nullif(btrim(p_paypal_email), '')),
    upper(nullif(regexp_replace(p_iban, '\s', '', 'g'), '')), upper(nullif(btrim(p_bic), '')),
    nullif(btrim(p_account_holder_name), ''), p_terms_version, now()
  from public.affiliate_settings s where s.id = 1
  returning affiliates.id into v_id;

  return query select v_id, v_code;
end;
$$;

revoke all on function public.register_affiliate(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.register_affiliate(text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.update_affiliate_payment_method(
  p_payment_method text,
  p_paypal_email text,
  p_iban text,
  p_bic text,
  p_account_holder_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_payment_method not in ('paypal', 'bank_transfer') then raise exception 'invalid_payment_method'; end if;
  if p_payment_method = 'paypal' and (p_paypal_email is null or p_iban is not null or p_account_holder_name is not null) then raise exception 'invalid_payment_details'; end if;
  if p_payment_method = 'bank_transfer' and (p_iban is null or nullif(btrim(p_account_holder_name), '') is null or p_paypal_email is not null) then raise exception 'invalid_payment_details'; end if;
  if p_payment_method = 'paypal' and p_paypal_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_paypal_email'; end if;
  if p_payment_method = 'bank_transfer' and upper(regexp_replace(p_iban, '\s', '', 'g')) !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$' then raise exception 'invalid_iban'; end if;
  if p_bic is not null and p_bic <> '' and upper(p_bic) !~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$' then raise exception 'invalid_bic'; end if;

  update public.affiliates
  set payment_method = p_payment_method,
      paypal_email = case when p_payment_method = 'paypal' then lower(btrim(p_paypal_email)) else null end,
      iban = case when p_payment_method = 'bank_transfer' then upper(regexp_replace(p_iban, '\s', '', 'g')) else null end,
      bic = case when p_payment_method = 'bank_transfer' then upper(nullif(btrim(p_bic), '')) else null end,
      account_holder_name = case when p_payment_method = 'bank_transfer' then btrim(p_account_holder_name) else null end,
      updated_at = now()
  where user_id = auth.uid();
  if not found then raise exception 'affiliate_not_found'; end if;
end;
$$;

revoke all on function public.update_affiliate_payment_method(text,text,text,text,text) from public;
grant execute on function public.update_affiliate_payment_method(text,text,text,text,text) to authenticated;

create or replace function public.affiliate_attribute_referral(
  p_referral_code text,
  p_referred_user_id uuid,
  p_qualified boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_affiliate public.affiliates%rowtype;
begin
  select * into v_affiliate
  from public.affiliates
  where referral_code = lower(p_referral_code) and status = 'active'
  for update;
  if not found or v_affiliate.user_id = p_referred_user_id then return false; end if;

  insert into public.affiliate_referrals(
    affiliate_id, referred_user_id, status, qualified_at,
    attribution_expires_at, referral_code_snapshot
  ) values (
    v_affiliate.id, p_referred_user_id,
    case when p_qualified then 'qualified' else 'pending' end,
    case when p_qualified then now() else null end,
    now() + interval '30 days', v_affiliate.referral_code
  ) on conflict (referred_user_id) do nothing;
  return found;
end;
$$;
revoke all on function public.affiliate_attribute_referral(text,uuid,boolean) from public;
grant execute on function public.affiliate_attribute_referral(text,uuid,boolean) to service_role;

create or replace function public.affiliate_qualify_referral(p_referred_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.affiliate_referrals
  set status = 'qualified', qualified_at = now()
  where referred_user_id = p_referred_user_id
    and status = 'pending'
    and attribution_expires_at >= now();
  return found;
end;
$$;
revoke all on function public.affiliate_qualify_referral(uuid) from public;
grant execute on function public.affiliate_qualify_referral(uuid) to service_role;

create or replace function public.affiliate_record_commission(
  p_referred_user_id uuid,
  p_stripe_invoice_id text,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_payment_intent_id text,
  p_amount_revenue_minor bigint,
  p_currency text,
  p_paid_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_rate_bps integer;
  v_hold_days integer;
  v_commission_minor bigint;
  v_id uuid;
begin
  if p_amount_revenue_minor <= 0 then raise exception 'invalid_revenue_amount'; end if;
  if p_currency !~ '^[a-z]{3}$' then raise exception 'invalid_currency'; end if;

  select r.affiliate_id, round(a.commission_rate * 100)::integer, s.commission_hold_days
    into v_affiliate_id, v_rate_bps, v_hold_days
  from public.affiliate_referrals r
  join public.affiliates a on a.id = r.affiliate_id
  cross join public.affiliate_settings s
  where r.referred_user_id = p_referred_user_id
    and r.status = 'qualified'
    and a.status = 'active'
    and s.id = 1
  for share of r, a;

  if not found then return null; end if;
  v_commission_minor := (p_amount_revenue_minor * v_rate_bps + 5000) / 10000;
  if v_commission_minor <= 0 then return null; end if;

  insert into public.affiliate_commissions (
    affiliate_id, referred_user_id, stripe_invoice_id, stripe_subscription_id,
    stripe_customer_id, stripe_payment_intent_id, amount_revenue, amount_commission, status, entry_type,
    source_id, currency, amount_revenue_minor, amount_commission_minor, rate_bps,
    available_at, created_at, updated_at
  ) values (
    v_affiliate_id, p_referred_user_id, p_stripe_invoice_id, p_stripe_subscription_id,
    p_stripe_customer_id, p_stripe_payment_intent_id, p_amount_revenue_minor / 100.0,
    v_commission_minor / 100.0, 'pending', 'commission',
    'invoice:' || p_stripe_invoice_id, lower(p_currency), p_amount_revenue_minor,
    v_commission_minor, v_rate_bps, p_paid_at + make_interval(days => v_hold_days), now(), now()
  )
  on conflict (source_id) do update set source_id = excluded.source_id
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.affiliate_record_commission(uuid,text,text,text,text,bigint,text,timestamptz) from public;
grant execute on function public.affiliate_record_commission(uuid,text,text,text,text,bigint,text,timestamptz) to service_role;

create or replace function public.affiliate_record_adjustment(
  p_parent_source_id text,
  p_adjustment_source_id text,
  p_entry_type text,
  p_amount_revenue_minor bigint,
  p_amount_commission_minor bigint,
  p_stripe_refund_id text default null,
  p_stripe_dispute_id text default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.affiliate_commissions%rowtype;
  v_id uuid;
  v_net_revenue bigint;
  v_net_commission bigint;
  v_already_adjusted_revenue bigint;
  v_already_adjusted_commission bigint;
  v_target_revenue bigint;
  v_target_commission bigint;
  v_revenue_delta bigint;
  v_commission_delta bigint;
begin
  if p_entry_type not in ('refund', 'dispute', 'manual_adjustment') then raise exception 'invalid_adjustment_type'; end if;

  select c.id into v_id from public.affiliate_commissions c where c.source_id = p_adjustment_source_id;
  if found then return v_id; end if;

  select * into v_parent
  from public.affiliate_commissions
  where source_id = p_parent_source_id and entry_type = 'commission'
  for update;
  if not found then raise exception 'parent_commission_not_found'; end if;

  if p_entry_type in ('refund', 'dispute') then
    if p_amount_revenue_minor >= 0 then raise exception 'invalid_adjustment_amount'; end if;
    select coalesce(sum(c.amount_revenue_minor), 0), coalesce(sum(c.amount_commission_minor), 0)
      into v_net_revenue, v_net_commission
    from public.affiliate_commissions c
    where c.parent_commission_id = v_parent.id;

    v_already_adjusted_revenue := greatest(0, -v_net_revenue);
    v_already_adjusted_commission := greatest(0, -v_net_commission);
    v_target_revenue := least(v_parent.amount_revenue_minor, v_already_adjusted_revenue + abs(p_amount_revenue_minor));
    v_target_commission := (v_parent.amount_commission_minor * v_target_revenue + (v_parent.amount_revenue_minor / 2)) / v_parent.amount_revenue_minor;
    v_revenue_delta := -(v_target_revenue - v_already_adjusted_revenue);
    v_commission_delta := -(v_target_commission - v_already_adjusted_commission);
    if v_revenue_delta = 0 then return null; end if;
  else
    if p_amount_commission_minor = 0 then raise exception 'invalid_adjustment_amount'; end if;
    v_revenue_delta := p_amount_revenue_minor;
    v_commission_delta := p_amount_commission_minor;
  end if;

  insert into public.affiliate_commissions (
    affiliate_id, referred_user_id, stripe_invoice_id, stripe_subscription_id,
    stripe_customer_id, stripe_payment_intent_id, amount_revenue, amount_commission, status, entry_type,
    source_id, stripe_refund_id, stripe_dispute_id, currency, amount_revenue_minor,
    amount_commission_minor, rate_bps, available_at, parent_commission_id, reason,
    created_at, updated_at
  ) values (
    v_parent.affiliate_id, v_parent.referred_user_id, null,
    v_parent.stripe_subscription_id, v_parent.stripe_customer_id, v_parent.stripe_payment_intent_id,
    v_revenue_delta / 100.0, v_commission_delta / 100.0,
    case when v_parent.status in ('paid', 'approved') then 'payable' else v_parent.status end,
    p_entry_type, p_adjustment_source_id, p_stripe_refund_id, p_stripe_dispute_id,
    v_parent.currency, v_revenue_delta, v_commission_delta,
    v_parent.rate_bps, least(v_parent.available_at, now()), v_parent.id, p_reason,
    now(), now()
  )
  on conflict (source_id) do update set source_id = excluded.source_id
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.affiliate_record_adjustment(text,text,text,bigint,bigint,text,text,text) from public;
grant execute on function public.affiliate_record_adjustment(text,text,text,bigint,bigint,text,text,text) to service_role;

create or replace function public.affiliate_record_or_queue_adjustment(
  p_stripe_payment_intent_id text,
  p_adjustment_source_id text,
  p_entry_type text,
  p_refund_amount_minor bigint,
  p_transaction_amount_minor bigint,
  p_stripe_refund_id text,
  p_stripe_dispute_id text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.affiliate_commissions%rowtype;
  v_adjustment public.affiliate_commissions%rowtype;
  v_pending public.affiliate_pending_adjustments%rowtype;
  v_commissionable_amount bigint;
  v_id uuid;
begin
  if p_entry_type not in ('refund', 'dispute') then raise exception 'invalid_adjustment_type'; end if;
  if p_refund_amount_minor <= 0 or p_transaction_amount_minor <= 0
     or p_refund_amount_minor > p_transaction_amount_minor then
    raise exception 'invalid_adjustment_amount';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('affiliate-payment:' || p_stripe_payment_intent_id, 0));

  insert into public.affiliate_pending_adjustments(
    source_id, stripe_payment_intent_id, entry_type, refund_amount_minor,
    transaction_amount_minor, stripe_refund_id, stripe_dispute_id, reason
  ) values (
    p_adjustment_source_id, p_stripe_payment_intent_id, p_entry_type,
    p_refund_amount_minor, p_transaction_amount_minor,
    p_stripe_refund_id, p_stripe_dispute_id, p_reason
  ) on conflict (source_id) do nothing;
  select * into v_pending from public.affiliate_pending_adjustments where source_id = p_adjustment_source_id;
  if v_pending.stripe_payment_intent_id is distinct from p_stripe_payment_intent_id
     or v_pending.entry_type is distinct from p_entry_type
     or v_pending.refund_amount_minor is distinct from p_refund_amount_minor
     or v_pending.transaction_amount_minor is distinct from p_transaction_amount_minor
     or v_pending.stripe_refund_id is distinct from p_stripe_refund_id
     or v_pending.stripe_dispute_id is distinct from p_stripe_dispute_id then
    raise exception 'adjustment_idempotency_conflict';
  end if;

  select * into v_parent
  from public.affiliate_commissions
  where stripe_payment_intent_id = p_stripe_payment_intent_id
    and entry_type = 'commission'
  order by created_at asc
  limit 1
  for update;
  if not found then return null; end if;

  v_commissionable_amount := greatest(
    1,
    least(
      v_parent.amount_revenue_minor,
      round(p_refund_amount_minor::numeric * v_parent.amount_revenue_minor / p_transaction_amount_minor)::bigint
    )
  );

  v_id := public.affiliate_record_adjustment(
    v_parent.source_id, p_adjustment_source_id, p_entry_type,
    -v_commissionable_amount, -1,
    p_stripe_refund_id, p_stripe_dispute_id, p_reason
  );

  if v_id is null then
    if p_entry_type = 'dispute' and p_stripe_dispute_id is not null
       and exists (
         select 1 from public.affiliate_pending_dispute_reversals
         where stripe_dispute_id = p_stripe_dispute_id and processed_at is null
       ) then
      update public.affiliate_pending_adjustments
      set processed_at = now()
      where source_id = p_adjustment_source_id and processed_at is null;
      update public.affiliate_pending_dispute_reversals
      set processed_at = now()
      where stripe_dispute_id = p_stripe_dispute_id and processed_at is null;
    end if;
    return null;
  end if;

  update public.affiliate_pending_adjustments
  set processed_at = now()
  where source_id = p_adjustment_source_id and processed_at is null;

  if p_entry_type = 'dispute' and p_stripe_dispute_id is not null
     and exists (
       select 1 from public.affiliate_pending_dispute_reversals
       where stripe_dispute_id = p_stripe_dispute_id and processed_at is null
     ) then
    select * into v_adjustment from public.affiliate_commissions where id = v_id;
    perform public.affiliate_record_adjustment(
      v_parent.source_id, 'dispute_reversal:' || p_stripe_dispute_id,
      'manual_adjustment', -v_adjustment.amount_revenue_minor,
      -v_adjustment.amount_commission_minor, null, null,
      'Dispute resolved in merchant favor'
    );
    update public.affiliate_pending_dispute_reversals
    set processed_at = now()
    where stripe_dispute_id = p_stripe_dispute_id and processed_at is null;
  end if;

  return v_id;
end;
$$;

revoke all on function public.affiliate_record_or_queue_adjustment(text,text,text,bigint,bigint,text,text,text) from public;
grant execute on function public.affiliate_record_or_queue_adjustment(text,text,text,bigint,bigint,text,text,text) to service_role;

create or replace function public.affiliate_reconcile_pending_adjustments(p_stripe_payment_intent_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending public.affiliate_pending_adjustments%rowtype;
  v_count integer := 0;
begin
  for v_pending in
    select * from public.affiliate_pending_adjustments
    where stripe_payment_intent_id = p_stripe_payment_intent_id
      and processed_at is null
    order by created_at asc
  loop
    perform public.affiliate_record_or_queue_adjustment(
      v_pending.stripe_payment_intent_id, v_pending.source_id,
      v_pending.entry_type, v_pending.refund_amount_minor,
      v_pending.transaction_amount_minor, v_pending.stripe_refund_id,
      v_pending.stripe_dispute_id, v_pending.reason
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.affiliate_reconcile_pending_adjustments(text) from public;
grant execute on function public.affiliate_reconcile_pending_adjustments(text) to service_role;

create or replace function public.affiliate_record_commission_and_reconcile(
  p_referred_user_id uuid,
  p_stripe_invoice_id text,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_payment_intent_id text,
  p_amount_revenue_minor bigint,
  p_currency text,
  p_paid_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if p_stripe_payment_intent_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('affiliate-payment:' || p_stripe_payment_intent_id, 0));
  end if;
  v_id := public.affiliate_record_commission(
    p_referred_user_id, p_stripe_invoice_id, p_stripe_subscription_id,
    p_stripe_customer_id, p_stripe_payment_intent_id,
    p_amount_revenue_minor, p_currency, p_paid_at
  );
  if p_stripe_payment_intent_id is not null then
    perform public.affiliate_reconcile_pending_adjustments(p_stripe_payment_intent_id);
  end if;
  return v_id;
end;
$$;

revoke all on function public.affiliate_record_commission_and_reconcile(uuid,text,text,text,text,bigint,text,timestamptz) from public;
grant execute on function public.affiliate_record_commission_and_reconcile(uuid,text,text,text,text,bigint,text,timestamptz) to service_role;

create or replace function public.affiliate_reverse_dispute(p_stripe_dispute_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adjustment public.affiliate_commissions%rowtype;
  v_parent public.affiliate_commissions%rowtype;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('affiliate-dispute:' || p_stripe_dispute_id, 0));
  select * into v_adjustment
  from public.affiliate_commissions
  where stripe_dispute_id = p_stripe_dispute_id and entry_type = 'dispute'
  order by created_at asc
  limit 1
  for update;

  if not found then
    insert into public.affiliate_pending_dispute_reversals(stripe_dispute_id)
    values (p_stripe_dispute_id)
    on conflict (stripe_dispute_id) do nothing;
    return null;
  end if;

  select * into v_parent
  from public.affiliate_commissions
  where id = v_adjustment.parent_commission_id
  for update;
  if not found then raise exception 'parent_commission_not_found'; end if;

  v_id := public.affiliate_record_adjustment(
    v_parent.source_id, 'dispute_reversal:' || p_stripe_dispute_id,
    'manual_adjustment', -v_adjustment.amount_revenue_minor,
    -v_adjustment.amount_commission_minor, null, null,
    'Dispute resolved in merchant favor'
  );
  update public.affiliate_pending_dispute_reversals
  set processed_at = now()
  where stripe_dispute_id = p_stripe_dispute_id and processed_at is null;
  if v_parent.stripe_payment_intent_id is not null then
    perform public.affiliate_reconcile_pending_adjustments(v_parent.stripe_payment_intent_id);
  end if;
  return v_id;
end;
$$;

revoke all on function public.affiliate_reverse_dispute(text) from public;
grant execute on function public.affiliate_reverse_dispute(text) to service_role;

create or replace function public.affiliate_mature_commissions(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  with locked as (
    select id from public.affiliate_commissions
    where status = 'pending' and available_at <= p_now
    for update skip locked
  )
  update public.affiliate_commissions c
  set status = 'payable', updated_at = p_now
  from locked where c.id = locked.id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.affiliate_mature_commissions(timestamptz) from public;
grant execute on function public.affiliate_mature_commissions(timestamptz) to service_role;

create or replace function public.affiliate_prepare_payout(
  p_affiliate_id uuid,
  p_currency text,
  p_payment_method text,
  p_actor_user_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_threshold bigint;
  v_payout_id uuid;
  v_existing_payout public.affiliate_payouts%rowtype;
begin
  perform 1 from public.affiliates where id = p_affiliate_id for update;
  if not found then raise exception 'affiliate_not_found'; end if;
  if p_payment_method not in ('paypal', 'bank_transfer', 'other') then raise exception 'invalid_payment_method'; end if;
  if lower(p_currency) !~ '^[a-z]{3}$' then raise exception 'invalid_currency'; end if;
  if nullif(btrim(p_idempotency_key), '') is null or char_length(p_idempotency_key) > 200 then raise exception 'invalid_idempotency_key'; end if;

  select * into v_existing_payout
  from public.affiliate_payouts
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing_payout.affiliate_id <> p_affiliate_id
       or v_existing_payout.currency <> lower(p_currency)
       or v_existing_payout.payment_method <> p_payment_method then
      raise exception 'idempotency_key_conflict';
    end if;
    return v_existing_payout.id;
  end if;

  perform id from public.affiliate_commissions
  where affiliate_id = p_affiliate_id and currency = lower(p_currency) and status = 'payable'
  for update;

  select coalesce(sum(amount_commission_minor), 0) into v_total
  from public.affiliate_commissions
  where affiliate_id = p_affiliate_id and currency = lower(p_currency) and status = 'payable';
  select minimum_payout_minor into v_threshold from public.affiliate_settings where id = 1;
  if v_total < v_threshold then raise exception 'minimum_payout_not_reached'; end if;

  insert into public.affiliate_payouts (
    affiliate_id, amount, amount_minor, currency, payment_method, status,
    idempotency_key, initiated_by, created_at, updated_at
  ) values (
    p_affiliate_id, v_total / 100.0, v_total, lower(p_currency), p_payment_method,
    'processing', p_idempotency_key, p_actor_user_id, now(), now()
  )
  returning id into v_payout_id;

  insert into public.affiliate_payout_items (payout_id, commission_id, amount_minor)
  select v_payout_id, id, amount_commission_minor
  from public.affiliate_commissions
  where affiliate_id = p_affiliate_id and currency = lower(p_currency) and status = 'payable'
  on conflict (commission_id) do nothing;

  update public.affiliate_commissions c
  set status = 'approved', updated_at = now()
  where exists (select 1 from public.affiliate_payout_items i where i.payout_id = v_payout_id and i.commission_id = c.id);

  insert into public.affiliate_admin_audit_log(actor_user_id, action, affiliate_id, payout_id, details)
  values (p_actor_user_id, 'payout_prepared', p_affiliate_id, v_payout_id, jsonb_build_object('amount_minor', v_total, 'currency', lower(p_currency)));
  return v_payout_id;
end;
$$;

revoke all on function public.affiliate_prepare_payout(uuid,text,text,uuid,text) from public;
grant execute on function public.affiliate_prepare_payout(uuid,text,text,uuid,text) to service_role;

create or replace function public.affiliate_confirm_payout(
  p_payout_id uuid,
  p_payment_reference text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_payout public.affiliate_payouts%rowtype;
begin
  if nullif(btrim(p_payment_reference), '') is null then raise exception 'payment_reference_required'; end if;
  if char_length(p_payment_reference) > 500 then raise exception 'payment_reference_too_long'; end if;
  select * into v_payout from public.affiliate_payouts where id = p_payout_id for update;
  if not found or v_payout.status <> 'processing' then raise exception 'payout_not_processing'; end if;

  update public.affiliate_commissions c set status = 'paid', payout_id = p_payout_id, updated_at = now()
  where exists (select 1 from public.affiliate_payout_items i where i.payout_id = p_payout_id and i.commission_id = c.id)
    and c.status = 'approved';
  if not found then raise exception 'payout_items_missing'; end if;

  update public.affiliate_payouts
  set status = 'paid', payment_reference = btrim(p_payment_reference), paid_at = now(),
      confirmed_by = p_actor_user_id, updated_at = now()
  where id = p_payout_id;

  insert into public.affiliate_admin_audit_log(actor_user_id, action, affiliate_id, payout_id, details)
  values (p_actor_user_id, 'payout_confirmed', v_payout.affiliate_id, p_payout_id, jsonb_build_object('reference', btrim(p_payment_reference)));
end;
$$;

revoke all on function public.affiliate_confirm_payout(uuid,text,uuid) from public;
grant execute on function public.affiliate_confirm_payout(uuid,text,uuid) to service_role;

create or replace function public.affiliate_fail_payout(
  p_payout_id uuid,
  p_reason text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_payout public.affiliate_payouts%rowtype;
begin
  select * into v_payout from public.affiliate_payouts where id = p_payout_id for update;
  if not found or v_payout.status <> 'processing' then raise exception 'payout_not_processing'; end if;

  update public.affiliate_commissions c set status = 'payable', updated_at = now()
  where exists (select 1 from public.affiliate_payout_items i where i.payout_id = p_payout_id and i.commission_id = c.id)
    and c.status = 'approved';
  update public.affiliate_payouts set status = 'failed', failure_reason = nullif(btrim(p_reason), ''), updated_at = now() where id = p_payout_id;
  insert into public.affiliate_admin_audit_log(actor_user_id, action, affiliate_id, payout_id, details)
  values (p_actor_user_id, 'payout_failed', v_payout.affiliate_id, p_payout_id, jsonb_build_object('reason', p_reason));
end;
$$;

revoke all on function public.affiliate_fail_payout(uuid,text,uuid) from public;
grant execute on function public.affiliate_fail_payout(uuid,text,uuid) to service_role;

create or replace function public.affiliate_admin_update(
  p_affiliate_id uuid,
  p_status text,
  p_commission_rate numeric,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_before public.affiliates%rowtype;
begin
  select * into v_before from public.affiliates where id = p_affiliate_id for update;
  if not found then raise exception 'affiliate_not_found'; end if;
  if p_status is not null and p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  if p_commission_rate is not null and (p_commission_rate < 0 or p_commission_rate > 100) then raise exception 'invalid_commission_rate'; end if;

  update public.affiliates
  set status = coalesce(p_status, status),
      commission_rate = coalesce(p_commission_rate, commission_rate),
      updated_at = now()
  where id = p_affiliate_id;

  insert into public.affiliate_admin_audit_log(actor_user_id, action, affiliate_id, details)
  values (
    p_actor_user_id,
    'affiliate_updated',
    p_affiliate_id,
    jsonb_build_object(
      'status_before', v_before.status,
      'status_after', coalesce(p_status, v_before.status),
      'rate_before', v_before.commission_rate,
      'rate_after', coalesce(p_commission_rate, v_before.commission_rate)
    )
  );
end;
$$;
revoke all on function public.affiliate_admin_update(uuid,text,numeric,uuid) from public;
grant execute on function public.affiliate_admin_update(uuid,text,numeric,uuid) to service_role;

create or replace function public.apply_stripe_subscription_state(
  p_user_id uuid,
  p_subscription_id text,
  p_customer_id text,
  p_active boolean,
  p_deleted boolean,
  p_subscription_created_at timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_event_created_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'profile_not_found'; end if;

  if p_deleted and v_profile.stripe_subscription_id is distinct from p_subscription_id then
    return false;
  end if;
  if not p_deleted
     and v_profile.stripe_subscription_id is distinct from p_subscription_id
     and v_profile.stripe_subscription_created_at is not null
     and p_subscription_created_at < v_profile.stripe_subscription_created_at then
    return false;
  end if;
  if v_profile.stripe_subscription_event_at is not null
     and v_profile.stripe_subscription_id is not distinct from p_subscription_id
     and p_event_created_at < v_profile.stripe_subscription_event_at then
    return false;
  end if;

  update public.profiles
  set plan = case when p_active and not p_deleted then 'pro' else 'free' end,
      stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
      stripe_subscription_id = p_subscription_id,
      stripe_subscription_created_at = case when p_deleted then stripe_subscription_created_at else p_subscription_created_at end,
      stripe_current_period_end = case when p_deleted then null else p_current_period_end end,
      subscription_cancel_at_period_end = case when p_deleted then false else coalesce(p_cancel_at_period_end, false) end,
      stripe_subscription_event_at = p_event_created_at,
      updated_at = now()
  where id = p_user_id;
  return true;
end;
$$;
revoke all on function public.apply_stripe_subscription_state(uuid,text,text,boolean,boolean,timestamptz,timestamptz,boolean,timestamptz) from public;
grant execute on function public.apply_stripe_subscription_state(uuid,text,text,boolean,boolean,timestamptz,timestamptz,boolean,timestamptz) to service_role;

create or replace function public.affiliate_claim_stripe_event(
  p_event_id text,
  p_event_type text,
  p_object_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_claimed boolean := false;
begin
  insert into public.stripe_webhook_events(event_id, event_type, object_id)
  values (p_event_id, p_event_type, p_object_id)
  on conflict (event_id) do nothing;
  if found then return true; end if;

  update public.stripe_webhook_events
  set status = 'processing', attempts = attempts + 1, last_error = null,
      processing_started_at = now(), updated_at = now()
  where event_id = p_event_id
    and (
      status = 'failed'
      or (status = 'processing' and processing_started_at < now() - interval '10 minutes')
    );
  if found then v_claimed := true; end if;
  return v_claimed;
end;
$$;

revoke all on function public.affiliate_claim_stripe_event(text,text,text) from public;
grant execute on function public.affiliate_claim_stripe_event(text,text,text) to service_role;

create or replace function public.affiliate_complete_stripe_event(p_event_id text)
returns void language sql security definer set search_path = public as $$
  update public.stripe_webhook_events
  set status = 'completed', completed_at = now(), updated_at = now(), last_error = null
  where event_id = p_event_id and status = 'processing';
$$;
revoke all on function public.affiliate_complete_stripe_event(text) from public;
grant execute on function public.affiliate_complete_stripe_event(text) to service_role;

create or replace function public.affiliate_fail_stripe_event(p_event_id text, p_error text)
returns void language sql security definer set search_path = public as $$
  update public.stripe_webhook_events
  set status = 'failed', last_error = left(p_error, 2000), updated_at = now()
  where event_id = p_event_id and status = 'processing';
$$;
revoke all on function public.affiliate_fail_stripe_event(text,text) from public;
grant execute on function public.affiliate_fail_stripe_event(text,text) to service_role;
