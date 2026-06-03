import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { AffiliateStats } from '@/types'

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Normalise un texte pour en faire un code court sans accent ni caractère spécial */
export function normalizeForCode(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
}

/** Génère un referral code unique : jusqu'à 8 chars de nom + 4 chiffres */
export async function generateUniqueReferralCode(firstName: string): Promise<string> {
  const supabase = getAdminClient()
  const base = normalizeForCode(firstName) || 'user'

  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = Math.floor(1000 + Math.random() * 9000).toString()
    const code = `${base}${digits}`
    const { data } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!data) return code
  }

  // Fallback: UUID-based code
  return `${base}${Date.now().toString(36).slice(-4)}`
}

/** Enregistre un clic de parrainage (idempotent — pas de déduplication stricte, mais IP-rate limité) */
export async function recordAffiliateClick(
  affiliateId: string,
  visitorId: string | null,
  ipHash: string | null,
  userAgent: string | null
): Promise<void> {
  const supabase = getAdminClient()
  await supabase.from('affiliate_clicks').insert({
    affiliate_id: affiliateId,
    visitor_id: visitorId,
    ip_hash: ipHash,
    user_agent: userAgent,
  })
}

/** Crée la relation permanente utilisateur → affilié.
 *  No-op si l'utilisateur est déjà attributé ou s'il essaie de s'auto-affilier. */
export async function attributeReferral(
  affiliateId: string,
  referredUserId: string
): Promise<boolean> {
  const supabase = getAdminClient()

  // Récupère l'affilié pour vérifier qu'il ne s'auto-affilie pas
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, user_id, status')
    .eq('id', affiliateId)
    .single()

  if (!affiliate || affiliate.status !== 'active') return false
  if (affiliate.user_id === referredUserId) return false

  // Vérifie si l'utilisateur est déjà attribué
  const { data: existing } = await supabase
    .from('affiliate_referrals')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .maybeSingle()

  if (existing) return false

  const { error } = await supabase.from('affiliate_referrals').insert({
    affiliate_id: affiliateId,
    referred_user_id: referredUserId,
  })

  return !error
}

/** Trouve l'affilié associé à un referral code */
export async function getAffiliateByCode(
  code: string
): Promise<{ id: string; user_id: string; status: string } | null> {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('affiliates')
    .select('id, user_id, status')
    .eq('referral_code', code)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

/** Crée une commission suite à un paiement Stripe (idempotent sur stripe_invoice_id) */
export async function createCommissionForInvoice(params: {
  affiliateId: string
  referredUserId: string
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  amountRevenue: number
  commissionRate: number
}): Promise<boolean> {
  const supabase = getAdminClient()
  const amountCommission = Math.round(
    (params.amountRevenue * params.commissionRate) / 100 * 100
  ) / 100

  const { error } = await supabase.from('affiliate_commissions').insert({
    affiliate_id: params.affiliateId,
    referred_user_id: params.referredUserId,
    stripe_invoice_id: params.stripeInvoiceId,
    stripe_subscription_id: params.stripeSubscriptionId,
    amount_revenue: params.amountRevenue,
    amount_commission: amountCommission,
    status: 'pending',
  })

  // Erreur 23505 = violation de contrainte unique (invoice déjà traitée)
  if (error && !error.code?.includes('23505')) {
    console.error('createCommissionForInvoice error:', error)
    return false
  }
  return true
}

/** Annule la commission liée à un remboursement Stripe */
export async function refundCommission(stripeInvoiceId: string): Promise<void> {
  const supabase = getAdminClient()
  await supabase
    .from('affiliate_commissions')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('stripe_invoice_id', stripeInvoiceId)
    .in('status', ['pending', 'approved', 'payable'])
}

/** Calcule les stats d'un affilié */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const supabase = getAdminClient()

  const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
    supabase
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId),
    supabase
      .from('affiliate_referrals')
      .select('referred_user_id, profiles!referred_user_id(plan)')
      .eq('affiliate_id', affiliateId),
    supabase
      .from('affiliate_commissions')
      .select('amount_revenue, amount_commission, status')
      .eq('affiliate_id', affiliateId),
  ])

  const commissions = commissionsRes.data ?? []
  const referrals = referralsRes.data ?? []

  const activeSubscribers = referrals.filter(r => {
    const p = r.profiles
    if (!p) return false
    const plan = Array.isArray(p) ? (p[0] as { plan?: string })?.plan : (p as { plan?: string })?.plan
    return plan === 'pro'
  }).length

  const sum = (statuses: string[]) =>
    commissions
      .filter(c => statuses.includes(c.status))
      .reduce((acc, c) => acc + Number(c.amount_commission), 0)

  return {
    total_clicks: clicksRes.count ?? 0,
    total_referrals: referrals.length,
    active_subscribers: activeSubscribers,
    total_revenue: commissions.reduce((acc, c) => acc + Number(c.amount_revenue), 0),
    total_commission: commissions.reduce((acc, c) => acc + Number(c.amount_commission), 0),
    commission_pending: sum(['pending']),
    commission_approved: sum(['approved']),
    commission_payable: sum(['payable']),
    commission_paid: sum(['paid']),
  }
}
