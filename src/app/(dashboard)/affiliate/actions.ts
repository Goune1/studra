'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateUniqueReferralCode } from '@/lib/affiliate'

export async function unlockAffiliate(_prevState: string | null, formData: FormData): Promise<string | null> {
  const password = formData.get('password') as string
  const expected = process.env.BAC_BETA_PASSWORD

  if (!expected || password !== expected) {
    return 'Mot de passe incorrect.'
  }

  const hash = createHash('sha256').update(expected).digest('hex')
  const cookieStore = await cookies()
  cookieStore.set('affiliate_beta_access', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  redirect('/affiliate')
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/

export async function registerAffiliate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Session expirée.' }

  const firstName = (formData.get('first_name') as string ?? '').trim().slice(0, 100)
  const lastName = (formData.get('last_name') as string ?? '').trim().slice(0, 100)
  const contactEmail = (formData.get('contact_email') as string ?? '').trim().toLowerCase()
  const paymentMethod = formData.get('payment_method') as string

  if (!firstName) return { ok: false, error: 'Prénom requis.' }
  if (!lastName) return { ok: false, error: 'Nom requis.' }
  if (!contactEmail || !EMAIL_REGEX.test(contactEmail)) return { ok: false, error: 'Email invalide.' }
  if (!['paypal', 'bank_transfer'].includes(paymentMethod)) {
    return { ok: false, error: 'Moyen de paiement requis.' }
  }

  let paypalEmail: string | null = null
  let iban: string | null = null
  let bic: string | null = null
  let accountHolder: string | null = null

  if (paymentMethod === 'paypal') {
    paypalEmail = (formData.get('paypal_email') as string ?? '').trim().toLowerCase()
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail)) {
      return { ok: false, error: 'Email PayPal invalide.' }
    }
  } else {
    accountHolder = (formData.get('account_holder_name') as string ?? '').trim().slice(0, 200)
    const rawIban = (formData.get('iban') as string ?? '').replace(/\s/g, '').toUpperCase()
    const rawBic = (formData.get('bic') as string ?? '').trim().toUpperCase().slice(0, 11)
    if (!accountHolder) return { ok: false, error: 'Titulaire du compte requis.' }
    if (!rawIban || !IBAN_REGEX.test(rawIban)) return { ok: false, error: 'IBAN invalide.' }
    iban = rawIban
    bic = rawBic || null
  }

  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { ok: false, error: 'Vous êtes déjà inscrit au programme.' }

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
    console.error('registerAffiliate error:', error)
    return { ok: false, error: 'Erreur lors de l\'inscription. Réessayez.' }
  }

  revalidatePath('/affiliate')
  return { ok: true, referral_code: referralCode }
}

export async function updatePaymentMethod(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Session expirée.' }

  const paymentMethod = formData.get('payment_method') as string
  if (!['paypal', 'bank_transfer'].includes(paymentMethod)) {
    return { ok: false, error: 'Moyen de paiement invalide.' }
  }

  const updates: Record<string, unknown> = {
    payment_method: paymentMethod,
    updated_at: new Date().toISOString(),
  }

  if (paymentMethod === 'paypal') {
    const paypalEmail = (formData.get('paypal_email') as string ?? '').trim().toLowerCase()
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail)) {
      return { ok: false, error: 'Email PayPal invalide.' }
    }
    updates.paypal_email = paypalEmail
    updates.iban = null
    updates.bic = null
    updates.account_holder_name = null
  } else {
    const rawIban = (formData.get('iban') as string ?? '').replace(/\s/g, '').toUpperCase()
    const rawBic = (formData.get('bic') as string ?? '').trim().toUpperCase().slice(0, 11)
    const accountHolder = (formData.get('account_holder_name') as string ?? '').trim().slice(0, 200)
    if (!accountHolder) return { ok: false, error: 'Titulaire du compte requis.' }
    if (!rawIban || !IBAN_REGEX.test(rawIban)) return { ok: false, error: 'IBAN invalide.' }
    updates.iban = rawIban
    updates.bic = rawBic || null
    updates.account_holder_name = accountHolder
    updates.paypal_email = null
  }

  const { error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Erreur lors de la mise à jour.' }

  revalidatePath('/affiliate')
  return { ok: true }
}
