import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeProEmail, sendSubscriptionCancelledEmail } from '@/lib/resend'
import { PostHog } from 'posthog-node'
import {
  createCommissionForInvoice,
  refundCommission,
} from '@/lib/affiliate'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Retrouve l'utilisateur Supabase depuis un customer Stripe, puis son affilié éventuel */
async function getAffiliateForCustomer(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  customerId: string
): Promise<{ userId: string; affiliateId: string; commissionRate: number } | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!profile) return null

  const { data: referral } = await supabaseAdmin
    .from('affiliate_referrals')
    .select('affiliate_id, affiliates(commission_rate, status)')
    .eq('referred_user_id', profile.id)
    .maybeSingle()

  if (!referral || !referral.affiliates) return null
  const aff = (Array.isArray(referral.affiliates) ? referral.affiliates[0] : referral.affiliates) as unknown as { commission_rate: number; status: string }
  if (aff.status !== 'active') return null

  return {
    userId: profile.id,
    affiliateId: referral.affiliate_id,
    commissionRate: Number(aff.commission_rate),
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id ?? session.client_reference_id
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (!userId) break

      await supabaseAdmin.from('profiles').update({
        plan: 'pro',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('id', userId)

      const email = session.customer_details?.email ?? session.metadata?.email
      if (email) {
        await sendWelcomeProEmail(email).catch(console.error)
      }

      const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      })
      await ph.capture({
        distinctId: userId,
        event: 'checkout_completed',
        properties: {
          plan: 'premium',
          price_eur: session.amount_total ? session.amount_total / 100 : null,
        },
      })
      await ph.shutdown()
      break
    }

    case 'invoice.paid': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any
      // Ne traiter que les abonnements (pas les paiements one-time)
      if (!invoice.subscription || !invoice.customer) break
      // Ignorer les factures à 0 (essais gratuits)
      if (!invoice.amount_paid || invoice.amount_paid === 0) break

      const customerId = invoice.customer as string
      const affiliateInfo = await getAffiliateForCustomer(supabaseAdmin, customerId)
      if (!affiliateInfo) break

      const amountRevenue = (invoice.amount_paid as number) / 100

      await createCommissionForInvoice({
        affiliateId: affiliateInfo.affiliateId,
        referredUserId: affiliateInfo.userId,
        stripeInvoiceId: invoice.id as string,
        stripeSubscriptionId: invoice.subscription as string,
        amountRevenue,
        commissionRate: affiliateInfo.commissionRate,
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id
      const isActive = subscription.status === 'active' || subscription.status === 'trialing'

      if (!userId) break

      await supabaseAdmin.from('profiles').update({
        plan: isActive ? 'pro' : 'free',
        stripe_subscription_id: subscription.id,
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (!userId) break

      await supabaseAdmin.from('profiles').update({
        plan: 'free',
        stripe_subscription_id: null,
      }).eq('id', userId)

      const customer = await getStripe().customers.retrieve(subscription.customer as string)
      const email = !customer.deleted && (customer as Stripe.Customer).email
      if (email) {
        await sendSubscriptionCancelledEmail(email).catch(console.error)
      }

      const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      })
      await ph.capture({
        distinctId: userId,
        event: 'subscription_cancelled',
        properties: { reason: null },
      })
      await ph.shutdown()
      break
    }

    case 'charge.refunded': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const charge = event.data.object as any
      const invoiceId = charge.invoice as string | null
      if (!invoiceId) break
      await refundCommission(invoiceId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
