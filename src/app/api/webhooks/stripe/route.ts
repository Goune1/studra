import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeProEmail, sendSubscriptionCancelledEmail } from '@/lib/resend'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
      break
    }
  }

  return NextResponse.json({ received: true })
}
