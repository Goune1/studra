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

/** Enregistre un paiement manuel et marque les commissions payables comme payées */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id: affiliateId } = await params
  const supabase = getAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const amount = Number(body.amount)
  const paymentMethod = body.payment_method as string
  const reference = typeof body.payment_reference === 'string' ? body.payment_reference.trim() : null

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }
  if (!['paypal', 'bank_transfer', 'other'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 })
  }

  // Crée le payout
  const { data: payout, error: payoutError } = await supabase
    .from('affiliate_payouts')
    .insert({
      affiliate_id: affiliateId,
      amount,
      payment_method: paymentMethod,
      payment_reference: reference,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (payoutError || !payout) {
    console.error('Payout creation error:', payoutError)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }

  // Marque les commissions payables comme payées et les associe au payout
  const { error: commError } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'paid',
      payout_id: payout.id,
      updated_at: new Date().toISOString(),
    })
    .eq('affiliate_id', affiliateId)
    .eq('status', 'payable')

  if (commError) {
    console.error('Commission update error:', commError)
    // Le payout est créé même si la mise à jour des commissions échoue
    // L'admin devra corriger manuellement
  }

  return NextResponse.json({ ok: true, payout_id: payout.id })
}
