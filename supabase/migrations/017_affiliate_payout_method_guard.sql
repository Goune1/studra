-- Bind every prepared payout to the affiliate's verified payment details.
-- This remains a separate migration because 016 may already have been applied.

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
  v_affiliate public.affiliates%rowtype;
begin
  select * into v_affiliate
  from public.affiliates
  where id = p_affiliate_id
  for update;
  if not found then raise exception 'affiliate_not_found'; end if;
  if p_payment_method not in ('paypal', 'bank_transfer') then raise exception 'invalid_payment_method'; end if;
  if p_payment_method is distinct from v_affiliate.payment_method then raise exception 'payment_method_mismatch'; end if;
  if p_payment_method = 'paypal' and v_affiliate.paypal_email is null then raise exception 'payment_details_incomplete'; end if;
  if p_payment_method = 'bank_transfer' and (v_affiliate.iban is null or v_affiliate.account_holder_name is null) then raise exception 'payment_details_incomplete'; end if;
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
  values (p_actor_user_id, 'payout_prepared', p_affiliate_id, v_payout_id, jsonb_build_object('amount_minor', v_total, 'currency', lower(p_currency), 'payment_method', p_payment_method));
  return v_payout_id;
end;
$$;

revoke all on function public.affiliate_prepare_payout(uuid,text,text,uuid,text) from public;
grant execute on function public.affiliate_prepare_payout(uuid,text,text,uuid,text) to service_role;
