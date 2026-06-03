import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateUniqueReferralCode } from '@/lib/affiliate'

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

  const firstName = typeof body.first_name === 'string' ? body.first_name.trim().slice(0, 100) : ''
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim().slice(0, 100) : ''
  const contactEmail = typeof body.contact_email === 'string' ? body.contact_email.trim().toLowerCase() : ''
  const paymentMethod = body.payment_method as string | undefined

  if (!firstName) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
  if (!lastName) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  if (!contactEmail || !EMAIL_REGEX.test(contactEmail)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }
  if (!paymentMethod || !['paypal', 'bank_transfer'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Moyen de paiement requis (paypal ou bank_transfer)' }, { status: 400 })
  }

  // Validation selon la méthode de paiement
  let paypalEmail: string | null = null
  let iban: string | null = null
  let bic: string | null = null
  let accountHolder: string | null = null

  if (paymentMethod === 'paypal') {
    paypalEmail = typeof body.paypal_email === 'string' ? body.paypal_email.trim().toLowerCase() : ''
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail) || paypalEmail.length > 254) {
      return NextResponse.json({ error: 'Email PayPal invalide' }, { status: 400 })
    }
  } else {
    accountHolder = typeof body.account_holder_name === 'string' ? body.account_holder_name.trim().slice(0, 200) : ''
    const rawIban = typeof body.iban === 'string' ? body.iban.replace(/\s/g, '').toUpperCase() : ''
    bic = typeof body.bic === 'string' ? body.bic.trim().toUpperCase().slice(0, 11) || null : null

    if (!accountHolder) return NextResponse.json({ error: 'Titulaire du compte requis' }, { status: 400 })
    if (!rawIban || !IBAN_REGEX.test(rawIban)) {
      return NextResponse.json({ error: 'IBAN invalide' }, { status: 400 })
    }
    iban = rawIban
  }

  // Vérifie qu'il n'est pas déjà affilié
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Vous êtes déjà inscrit au programme d\'affiliation' }, { status: 409 })
  }

  const referralCode = await generateUniqueReferralCode(firstName)

  const { error } = await supabase.from('affiliates').insert({
    user_id: user.id,
    referral_code: referralCode,
    first_name: firstName,
    last_name: lastName,
    contact_email: contactEmail,
    payment_method: paymentMethod,
    paypal_email: paypalEmail,
    iban,
    bic,
    account_holder_name: accountHolder,
    status: 'active',
  })

  if (error) {
    console.error('Affiliate registration error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, referral_code: referralCode })
}
