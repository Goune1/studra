import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  })
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  referralCode?: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
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
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    },
    metadata: {
      user_id: userId,
      ...(referralCode ? { referral_code: referralCode } : {}),
    },
    client_reference_id: userId,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
  })

  return session.url!
}

export async function createPortalSession(customerId: string): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return session.url
}
