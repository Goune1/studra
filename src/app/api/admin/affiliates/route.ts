import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function checkAdmin(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) return null
  return user
}

export async function GET(request: Request) {
  const admin = await checkAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = getAdminClient()

  const { data: affiliates, error } = await supabase
    .from('affiliates')
    .select(`
      id, user_id, referral_code, commission_rate, status,
      first_name, last_name, contact_email,
      payment_method, paypal_email, iban, bic, account_holder_name,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Agrège les stats pour chaque affilié
  const affiliateIds = (affiliates ?? []).map((a: { id: string }) => a.id)

  if (affiliateIds.length === 0) {
    return NextResponse.json({ affiliates: [] })
  }

  const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
    supabase
      .from('affiliate_clicks')
      .select('affiliate_id')
      .in('affiliate_id', affiliateIds),
    supabase
      .from('affiliate_referrals')
      .select('affiliate_id, referred_user_id, profiles!inner(plan)')
      .in('affiliate_id', affiliateIds),
    supabase
      .from('affiliate_commissions')
      .select('affiliate_id, amount_revenue, amount_commission, status')
      .in('affiliate_id', affiliateIds),
  ])

  const clicks = clicksRes.data ?? []
  const referrals = referralsRes.data ?? []
  const commissions = commissionsRes.data ?? []

  type ReferralRow = { affiliate_id: string; referred_user_id: string; profiles: unknown }
  type CommRow = { affiliate_id: string; amount_revenue: number; amount_commission: number; status: string }

  function getPlan(profiles: unknown): string {
    if (!profiles) return 'free'
    const p = Array.isArray(profiles) ? profiles[0] : profiles
    return (p as { plan?: string })?.plan ?? 'free'
  }

  const result = (affiliates ?? []).map((a: { id: string; [key: string]: unknown }) => {
    const aClicks = clicks.filter((c: { affiliate_id: string }) => c.affiliate_id === a.id).length
    const aReferrals = (referrals as ReferralRow[]).filter(r => r.affiliate_id === a.id)
    const aCommissions = (commissions as CommRow[]).filter(c => c.affiliate_id === a.id)

    return {
      ...a,
      stats: {
        total_clicks: aClicks,
        total_referrals: aReferrals.length,
        active_subscribers: aReferrals.filter(r => getPlan(r.profiles) === 'pro').length,
        total_revenue: aCommissions.reduce((s, c) => s + Number(c.amount_revenue), 0),
        total_commission: aCommissions.reduce((s, c) => s + Number(c.amount_commission), 0),
        commission_pending: aCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount_commission), 0),
        commission_approved: aCommissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount_commission), 0),
        commission_payable: aCommissions.filter(c => c.status === 'payable').reduce((s, c) => s + Number(c.amount_commission), 0),
        commission_paid: aCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount_commission), 0),
      },
    }
  })

  return NextResponse.json({ affiliates: result })
}
