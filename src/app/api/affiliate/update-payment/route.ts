import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const paymentMethod = body.payment_method as string | undefined

  if (!paymentMethod || !['paypal', 'bank_transfer'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Moyen de paiement invalide' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    payment_method: paymentMethod,
    updated_at: new Date().toISOString(),
  }

  if (paymentMethod === 'paypal') {
    const paypalEmail = typeof body.paypal_email === 'string' ? body.paypal_email.trim().toLowerCase() : ''
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail) || paypalEmail.length > 254) {
      return NextResponse.json({ error: 'Email PayPal invalide' }, { status: 400 })
    }
    updates.paypal_email = paypalEmail
    updates.iban = null
    updates.bic = null
    updates.account_holder_name = null
  } else {
    const rawIban = typeof body.iban === 'string' ? body.iban.replace(/\s/g, '').toUpperCase() : ''
    const bic = typeof body.bic === 'string' ? body.bic.trim().toUpperCase().slice(0, 11) || null : null
    const accountHolder = typeof body.account_holder_name === 'string' ? body.account_holder_name.trim().slice(0, 200) : ''

    if (!accountHolder) return NextResponse.json({ error: 'Titulaire du compte requis' }, { status: 400 })
    if (!rawIban || !IBAN_REGEX.test(rawIban)) {
      return NextResponse.json({ error: 'IBAN invalide' }, { status: 400 })
    }

    updates.iban = rawIban
    updates.bic = bic
    updates.account_holder_name = accountHolder
    updates.paypal_email = null
  }

  const { error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update payment error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
