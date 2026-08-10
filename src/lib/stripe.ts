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

export async function getProPriceDisplay(): Promise<string> {
  const stripe = getStripe()
  const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID!)
  const amount = (price.unit_amount ?? 0) / 100
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: price.currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
  const interval = price.recurring?.interval === 'year' ? 'an' : 'mois'
  return `${formatted}/${interval}`
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

/**
 * Cancels a subscription immediately (not at period end). Used when a user
 * deletes their account: we must stop billing right away rather than let it
 * run until the next renewal. Safe to call on an already-canceled subscription.
 */
export async function cancelSubscriptionImmediately(subscriptionId: string): Promise<void> {
  const stripe = getStripe()
  try {
    await stripe.subscriptions.cancel(subscriptionId)
  } catch (error) {
    // Already canceled / doesn't exist: not fatal for account deletion.
    if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
      return
    }
    throw error
  }
}
