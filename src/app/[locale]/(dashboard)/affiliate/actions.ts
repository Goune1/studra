'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function unlockAffiliate(_prevState: string | null, formData: FormData): Promise<string | null> {
  const password = formData.get('password') as string
  const expected = process.env.BAC_BETA_PASSWORD
  if (!expected || password !== expected) return "Mot de passe incorrect."

  const hash = createHash('sha256').update(expected).digest('hex')
  const cookieStore = await cookies()
  cookieStore.set('affiliate_beta_access', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  redirect('/affiliate')
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/

type PaymentDetails = {
  paymentMethod: 'paypal' | 'bank_transfer'
  paypalEmail: string | null
  iban: string | null
  bic: string | null
  accountHolder: string | null
}

function parsePaymentDetails(formData: FormData): PaymentDetails | null {
  const paymentMethod = formData.get('payment_method')
  if (paymentMethod !== 'paypal' && paymentMethod !== 'bank_transfer') return null

  if (paymentMethod === 'paypal') {
    const paypalEmail = (formData.get('paypal_email') as string ?? '').trim().toLowerCase()
    if (!EMAIL_REGEX.test(paypalEmail) || paypalEmail.length > 254) return null
    return { paymentMethod, paypalEmail, iban: null, bic: null, accountHolder: null }
  }

  const iban = (formData.get('iban') as string ?? '').replace(/\s/g, '').toUpperCase()
  const bic = (formData.get('bic') as string ?? '').trim().toUpperCase().slice(0, 11) || null
  const accountHolder = (formData.get('account_holder_name') as string ?? '').trim().slice(0, 200)
  if (!IBAN_REGEX.test(iban) || !accountHolder) return null
  return { paymentMethod, paypalEmail: null, iban, bic, accountHolder }
}

export async function registerAffiliate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Session expirée." }

  const firstName = (formData.get('first_name') as string ?? '').trim().slice(0, 100)
  const lastName = (formData.get('last_name') as string ?? '').trim().slice(0, 100)
  const contactEmail = (formData.get('contact_email') as string ?? '').trim().toLowerCase()
  const termsVersion = (formData.get('terms_version') as string ?? '').trim()
  const acceptedTerms = formData.get('accept_terms') === 'on'
  const payment = parsePaymentDetails(formData)

  if (!firstName) return { ok: false, error: "Prénom requis." }
  if (!lastName) return { ok: false, error: "Nom requis." }
  if (!EMAIL_REGEX.test(contactEmail) || contactEmail.length > 254) return { ok: false, error: "Email invalide." }
  if (!payment) return { ok: false, error: "Moyen de paiement requis." }
  if (!acceptedTerms || !termsVersion) return { ok: false, error: 'Vous devez accepter les conditions du programme.' }

  const { data, error } = await supabase.rpc('register_affiliate', {
    p_first_name: firstName,
    p_last_name: lastName,
    p_contact_email: contactEmail,
    p_payment_method: payment.paymentMethod,
    p_paypal_email: payment.paypalEmail,
    p_iban: payment.iban,
    p_bic: payment.bic,
    p_account_holder_name: payment.accountHolder,
    p_terms_version: termsVersion,
  })
  if (error) {
    console.error('register_affiliate error:', error.message)
    return { ok: false, error: error.message.includes('already_registered') ? "Vous êtes déjà inscrit au programme." : "Erreur lors de l'inscription. Réessayez." }
  }

  revalidatePath('/affiliate')
  const row = Array.isArray(data) ? data[0] : data
  return { ok: true, referral_code: row?.referral_code as string | undefined }
}

export async function updatePaymentMethod(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Session expirée." }

  const payment = parsePaymentDetails(formData)
  if (!payment) return { ok: false, error: "Moyen de paiement invalide." }

  const { error } = await supabase.rpc('update_affiliate_payment_method', {
    p_payment_method: payment.paymentMethod,
    p_paypal_email: payment.paypalEmail,
    p_iban: payment.iban,
    p_bic: payment.bic,
    p_account_holder_name: payment.accountHolder,
  })
  if (error) return { ok: false, error: "Erreur lors de la mise à jour." }

  revalidatePath('/affiliate')
  return { ok: true }
}
