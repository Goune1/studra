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

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  return user && adminEmail && user.email === adminEmail ? user : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const supabase = getAdminClient()

  const [affiliateRes, commissionsRes, payoutsRes, referralsRes] = await Promise.all([
    supabase
      .from('affiliates')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('affiliate_referrals')
      .select('*, profiles!referred_user_id(email, full_name, plan, stripe_subscription_id)')
      .eq('affiliate_id', id),
  ])

  if (affiliateRes.error) {
    return NextResponse.json({ error: 'Affilié introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    affiliate: affiliateRes.data,
    commissions: commissionsRes.data ?? [],
    payouts: payoutsRes.data ?? [],
    referrals: referralsRes.data ?? [],
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const supabase = getAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const status = 'status' in body ? body.status : null
  if (status !== null && status !== 'active' && status !== 'suspended') {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }
  let commissionRate: number | null = null
  if ('commission_rate' in body) {
    commissionRate = Number(body.commission_rate)
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return NextResponse.json({ error: 'Taux invalide (0-100)' }, { status: 400 })
    }
  }
  if (status === null && commissionRate === null) {
    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  }

  const { error } = await supabase.rpc('affiliate_admin_update', {
    p_affiliate_id: id,
    p_status: status,
    p_commission_rate: commissionRate,
    p_actor_user_id: admin.id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
