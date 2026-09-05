import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  return user && adminEmail && user.email === adminEmail ? user : null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id: affiliateId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : 'prepare'
  const supabase = getAdminClient()

  if (action === 'prepare') {
    const paymentMethod = typeof body.payment_method === 'string' ? body.payment_method : ''
    const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() : ''
    if (!['paypal', 'bank_transfer'].includes(paymentMethod) || !idempotencyKey) {
      return NextResponse.json({ error: 'Paramètres de préparation invalides' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('affiliate_prepare_payout', {
      p_affiliate_id: affiliateId,
      p_currency: 'eur',
      p_payment_method: paymentMethod,
      p_actor_user_id: admin.id,
      p_idempotency_key: idempotencyKey,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, payout_id: data, status: 'processing' })
  }

  const payoutId = typeof body.payout_id === 'string' ? body.payout_id : ''
  if (!payoutId) return NextResponse.json({ error: 'Paiement manquant' }, { status: 400 })

  if (action === 'confirm') {
    const reference = typeof body.payment_reference === 'string' ? body.payment_reference.trim() : ''
    if (!reference) return NextResponse.json({ error: 'La référence du transfert est obligatoire' }, { status: 400 })
    const { error } = await supabase.rpc('affiliate_confirm_payout', {
      p_payout_id: payoutId,
      p_payment_reference: reference,
      p_actor_user_id: admin.id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, payout_id: payoutId, status: 'paid' })
  }

  if (action === 'fail') {
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const { error } = await supabase.rpc('affiliate_fail_payout', {
      p_payout_id: payoutId,
      p_reason: reason || 'Transfert externe échoué',
      p_actor_user_id: admin.id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, payout_id: payoutId, status: 'failed' })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
