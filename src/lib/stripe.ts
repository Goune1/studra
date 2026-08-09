import Stripe from 'stripe'
import {getLocalizedPathname, type AppLocale} from '@/i18n/pathname'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  })
}

function billingUrl(locale: AppLocale, status?: 'success' | 'canceled'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'
  const url = new URL(getLocalizedPathname('/billing', locale), appUrl)
  if (status) url.searchParams.set(status, 'true')
  return url.toString()
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  locale: AppLocale,
  referralCode?: string,
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    locale,
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        user_id: userId,
        locale,
        ...(referralCode ? {referral_code: referralCode} : {}),
      },
    },
    metadata: {
      user_id: userId,
      locale,
      ...(referralCode ? {referral_code: referralCode} : {}),
    },
    client_reference_id: userId,
    success_url: billingUrl(locale, 'success'),
    cancel_url: billingUrl(locale, 'canceled'),
  })

  return session.url!
}

export async function createPortalSession(
  customerId: string,
  locale: AppLocale,
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    locale,
    return_url: billingUrl(locale),
  })

  return session.url
}
