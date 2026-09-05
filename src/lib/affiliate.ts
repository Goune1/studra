import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { AffiliateStats } from '@/types'

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function requireSuccess(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

export async function recordAffiliateClick(
  affiliateId: string,
  dedupeKey: string,
): Promise<void> {
  const { error } = await getAdminClient().from('affiliate_clicks').upsert({
    affiliate_id: affiliateId,
    visitor_id: null,
    ip_hash: null,
    user_agent: null,
    dedupe_key: dedupeKey,
  }, { onConflict: 'dedupe_key', ignoreDuplicates: true })
  requireSuccess(error, 'recordAffiliateClick')
}

export async function attributeReferral(
  referralCode: string,
  referredUserId: string,
  qualified: boolean,
): Promise<boolean> {
  const { data, error } = await getAdminClient().rpc('affiliate_attribute_referral', {
    p_referral_code: referralCode,
    p_referred_user_id: referredUserId,
    p_qualified: qualified,
  })
  requireSuccess(error, 'affiliate_attribute_referral')
  return data === true
}

export async function qualifyReferral(referredUserId: string): Promise<boolean> {
  const { data, error } = await getAdminClient().rpc('affiliate_qualify_referral', {
    p_referred_user_id: referredUserId,
  })
  requireSuccess(error, 'affiliate_qualify_referral')
  return data === true
}

export async function getAffiliateByCode(
  code: string,
): Promise<{ id: string; user_id: string; status: string } | null> {
  const { data, error } = await getAdminClient()
    .from('affiliates')
    .select('id, user_id, status')
    .eq('referral_code', code)
    .eq('status', 'active')
    .maybeSingle()
  requireSuccess(error, 'getAffiliateByCode')
  return data
}

export async function createCommissionForInvoice(params: {
  referredUserId: string
  stripeInvoiceId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePaymentIntentId: string | null
  amountRevenueMinor: number
  currency: string
  paidAt: Date
}): Promise<string | null> {
  const { data, error } = await getAdminClient().rpc('affiliate_record_commission_and_reconcile', {
    p_referred_user_id: params.referredUserId,
    p_stripe_invoice_id: params.stripeInvoiceId,
    p_stripe_subscription_id: params.stripeSubscriptionId,
    p_stripe_customer_id: params.stripeCustomerId,
    p_stripe_payment_intent_id: params.stripePaymentIntentId,
    p_amount_revenue_minor: params.amountRevenueMinor,
    p_currency: params.currency.toLowerCase(),
    p_paid_at: params.paidAt.toISOString(),
  })
  requireSuccess(error, 'affiliate_record_commission_and_reconcile')
  return typeof data === 'string' ? data : null
}

export async function recordNegativeAdjustment(params: {
  stripePaymentIntentId: string
  sourceId: string
  entryType: 'refund' | 'dispute'
  amountRevenueMinor: number
  transactionAmountMinor: number
  stripeRefundId?: string
  stripeDisputeId?: string
  reason?: string
}): Promise<string | null> {
  if (!Number.isSafeInteger(params.amountRevenueMinor) || params.amountRevenueMinor <= 0) {
    throw new TypeError('amountRevenueMinor must be a positive safe integer')
  }
  if (!Number.isSafeInteger(params.transactionAmountMinor) || params.transactionAmountMinor <= 0) {
    throw new TypeError('transactionAmountMinor must be a positive safe integer')
  }
  const { data, error } = await getAdminClient().rpc('affiliate_record_or_queue_adjustment', {
    p_stripe_payment_intent_id: params.stripePaymentIntentId,
    p_adjustment_source_id: params.sourceId,
    p_entry_type: params.entryType,
    p_refund_amount_minor: params.amountRevenueMinor,
    p_transaction_amount_minor: params.transactionAmountMinor,
    p_stripe_refund_id: params.stripeRefundId ?? null,
    p_stripe_dispute_id: params.stripeDisputeId ?? null,
    p_reason: params.reason ?? null,
  })
  requireSuccess(error, 'affiliate_record_or_queue_adjustment')
  return typeof data === 'string' ? data : null
}

export async function reverseDisputeAdjustment(disputeId: string): Promise<string | null> {
  const { data, error } = await getAdminClient().rpc('affiliate_reverse_dispute', {
    p_stripe_dispute_id: disputeId,
  })
  requireSuccess(error, 'affiliate_reverse_dispute')
  return typeof data === 'string' ? data : null
}

export async function releaseMatureCommissions(): Promise<number> {
  const { data, error } = await getAdminClient().rpc('affiliate_mature_commissions', {
    p_now: new Date().toISOString(),
  })
  requireSuccess(error, 'affiliate_mature_commissions')
  return Number(data ?? 0)
}

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const supabase = getAdminClient()
  await releaseMatureCommissions()

  const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
    supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
    supabase
      .from('affiliate_referrals')
      .select('referred_user_id, status, profiles!referred_user_id(plan)')
      .eq('affiliate_id', affiliateId),
    supabase
      .from('affiliate_commissions')
      .select('amount_revenue_minor, amount_commission_minor, status')
      .eq('affiliate_id', affiliateId),
  ])

  requireSuccess(clicksRes.error, 'affiliate stats clicks')
  requireSuccess(referralsRes.error, 'affiliate stats referrals')
  requireSuccess(commissionsRes.error, 'affiliate stats commissions')

  const commissions = commissionsRes.data ?? []
  const referrals = (referralsRes.data ?? []).filter((referral) => referral.status === 'qualified')
  const activeSubscribers = referrals.filter((referral) => {
    const relation = referral.profiles
    const profile = Array.isArray(relation) ? relation[0] : relation
    return (profile as { plan?: string } | null)?.plan === 'pro'
  }).length
  const sum = (statuses: string[]) => commissions
    .filter((commission) => statuses.includes(commission.status))
    .reduce((total, commission) => total + Number(commission.amount_commission_minor), 0) / 100

  return {
    total_clicks: clicksRes.count ?? 0,
    total_referrals: referrals.length,
    active_subscribers: activeSubscribers,
    total_revenue: commissions.reduce((total, commission) => total + Number(commission.amount_revenue_minor), 0) / 100,
    total_commission: commissions.reduce((total, commission) => total + Number(commission.amount_commission_minor), 0) / 100,
    commission_pending: sum(['pending']),
    commission_approved: sum(['approved']),
    commission_payable: sum(['payable']),
    commission_paid: sum(['paid']),
  }
}
