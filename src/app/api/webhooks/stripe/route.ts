import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendWelcomeProEmail, sendSubscriptionCancelledEmail } from '@/lib/resend'
import { PostHog } from 'posthog-node'
import {
  createCommissionForInvoice,
  qualifyReferral,
  recordNegativeAdjustment,
  reverseDisputeAdjustment,
} from '@/lib/affiliate'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>

function objectId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function requireDatabaseSuccess(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

async function getInvoiceIdentity(
  stripe: Stripe,
  supabaseAdmin: AdminClient,
  invoice: Stripe.Invoice,
): Promise<{ userId: string; subscriptionId: string; customerId: string } | null> {
  const subscriptionReference = invoice.parent?.subscription_details?.subscription
  const subscriptionId = objectId(subscriptionReference)
  const customerId = objectId(invoice.customer)
  if (!subscriptionId || !customerId) return null

  let userId = invoice.parent?.subscription_details?.metadata?.user_id
  if (!userId) {
    const subscription = typeof subscriptionReference === 'string'
      ? await stripe.subscriptions.retrieve(subscriptionReference)
      : subscriptionReference
    userId = subscription?.metadata.user_id
  }
  if (!userId) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    requireDatabaseSuccess(error, 'getInvoiceIdentity')
    userId = profile?.id
  }
  return userId ? { userId, subscriptionId, customerId } : null
}

async function getInvoicePaymentIntentId(stripe: Stripe, invoice: Stripe.Invoice): Promise<string | null> {
  const embedded = invoice.payments?.data.find((payment) => payment.payment.type === 'payment_intent')
  const embeddedId = objectId(embedded?.payment.payment_intent)
  if (embeddedId) return embeddedId

  const payments = await stripe.invoicePayments.list({ invoice: invoice.id, limit: 10 })
  const payment = payments.data.find((item) => item.payment.type === 'payment_intent')
  return objectId(payment?.payment.payment_intent)
}

function commissionableInvoiceAmountMinor(invoice: Stripe.Invoice): number {
  const excludingTax = invoice.total_excluding_tax ?? invoice.amount_paid
  return Math.max(0, Math.min(invoice.amount_paid, excludingTax))
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const ends = subscription.items.data.map((item) => item.current_period_end)
  return ends.length > 0 ? new Date(Math.max(...ends) * 1000).toISOString() : null
}

async function resolveSubscriptionUserId(
  supabaseAdmin: AdminClient,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  if (subscription.metadata.user_id) return subscription.metadata.user_id
  const customerId = objectId(subscription.customer)
  const filter = customerId
    ? `stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${customerId}`
    : `stripe_subscription_id.eq.${subscription.id}`
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .or(filter)
    .limit(1)
    .maybeSingle()
  requireDatabaseSuccess(error, 'resolveSubscriptionUserId')
  return data?.id ?? null
}

async function applySubscriptionState(
  supabaseAdmin: AdminClient,
  event: Stripe.Event,
  subscription: Stripe.Subscription,
  userId: string,
  deleted: boolean,
): Promise<boolean> {
  const active = subscription.status === 'active' || subscription.status === 'trialing'
  const { data, error } = await supabaseAdmin.rpc('apply_stripe_subscription_state', {
    p_user_id: userId,
    p_subscription_id: subscription.id,
    p_customer_id: objectId(subscription.customer),
    p_active: active,
    p_deleted: deleted,
    p_subscription_created_at: new Date(subscription.created * 1000).toISOString(),
    p_current_period_end: deleted ? null : subscriptionPeriodEnd(subscription),
    p_cancel_at_period_end: deleted ? false : subscription.cancel_at_period_end,
    p_event_created_at: new Date(event.created * 1000).toISOString(),
  })
  requireDatabaseSuccess(error, 'apply_stripe_subscription_state')
  return data === true
}

async function capturePostHog(distinctId: string, event: string, properties: Record<string, unknown>) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return
  const posthog = new PostHog(apiKey, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST })
  try {
    await posthog.capture({ distinctId, event, properties })
  } finally {
    await posthog.shutdown()
  }
}

async function processStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseAdmin: AdminClient,
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id ?? session.client_reference_id
      const customerId = objectId(session.customer)
      const subscriptionId = objectId(session.subscription)
      if (!userId || !customerId || !subscriptionId) return
      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription
      if (!subscription || !await applySubscriptionState(supabaseAdmin, event, subscription, userId, false)) return

            const email = session.customer_details?.email ?? session.metadata?.email
      if (email) await sendWelcomeProEmail(email).catch(console.error)
      await capturePostHog(userId, 'checkout_completed', {
        plan: 'premium',
        price_minor: session.amount_total,
        currency: session.currency,
      }).catch(console.error)
      return
    }

    case 'invoice.paid': {
      const invoice = event.data.object
      const amountRevenueMinor = commissionableInvoiceAmountMinor(invoice)
      if (amountRevenueMinor <= 0) return
      const identity = await getInvoiceIdentity(stripe, supabaseAdmin, invoice)
      if (!identity) return

      await qualifyReferral(identity.userId)
      await createCommissionForInvoice({
        referredUserId: identity.userId,
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: identity.subscriptionId,
        stripeCustomerId: identity.customerId,
        stripePaymentIntentId: await getInvoicePaymentIntentId(stripe, invoice),
        amountRevenueMinor,
        currency: invoice.currency,
        paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000),
      })
      return
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const userId = await resolveSubscriptionUserId(supabaseAdmin, subscription)
      if (!userId) return
      await applySubscriptionState(supabaseAdmin, event, subscription, userId, false)
      return
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const userId = await resolveSubscriptionUserId(supabaseAdmin, subscription)
      if (!userId) return
      if (!await applySubscriptionState(supabaseAdmin, event, subscription, userId, true)) return

            const customer = await stripe.customers.retrieve(objectId(subscription.customer)!)
      const email = !customer.deleted ? customer.email : null
      if (email) await sendSubscriptionCancelledEmail(email).catch(console.error)
      await capturePostHog(userId, 'subscription_cancelled', { reason: null }).catch(console.error)
      return
    }

    case 'charge.refunded': {
      const charge = event.data.object
      const paymentIntentId = objectId(charge.payment_intent)
      if (!paymentIntentId || !charge.refunds) return
      for (const refund of charge.refunds.data) {
        await recordNegativeAdjustment({
          stripePaymentIntentId: paymentIntentId,
          sourceId: `refund:${refund.id}`,
          entryType: 'refund',
          amountRevenueMinor: refund.amount,
          transactionAmountMinor: charge.amount,
          stripeRefundId: refund.id,
          reason: refund.reason ?? 'Stripe refund',
        })
      }
      return
    }

    case 'refund.created': {
      const refund = event.data.object
      const chargeId = objectId(refund.charge)
      if (!chargeId) return
      const charge = await stripe.charges.retrieve(chargeId)
      const paymentIntentId = objectId(charge.payment_intent)
      if (!paymentIntentId) return
      await recordNegativeAdjustment({
        stripePaymentIntentId: paymentIntentId,
        sourceId: `refund:${refund.id}`,
        entryType: 'refund',
        amountRevenueMinor: refund.amount,
        transactionAmountMinor: charge.amount,
        stripeRefundId: refund.id,
        reason: refund.reason ?? 'Stripe refund',
      })
      return
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object
      const charge = typeof dispute.charge === 'string'
        ? await stripe.charges.retrieve(dispute.charge)
        : dispute.charge
      const paymentIntentId = objectId(charge.payment_intent)
      if (!paymentIntentId) return
      await recordNegativeAdjustment({
        stripePaymentIntentId: paymentIntentId,
        sourceId: `dispute:${dispute.id}`,
        entryType: 'dispute',
        amountRevenueMinor: dispute.amount,
        transactionAmountMinor: charge.amount,
        stripeDisputeId: dispute.id,
        reason: dispute.reason,
      })
      return
    }

    case 'charge.dispute.closed': {
      const dispute = event.data.object
      if (dispute.status === 'won' || dispute.status === 'warning_closed') {
        await reverseDisputeAdjustment(dispute.id)
      }
      return
    }
  }
}

async function claimEvent(
  supabaseAdmin: SupabaseClient,
  event: Stripe.Event,
): Promise<boolean> {
  const eventObject = event.data.object as { id?: string }
  const { data, error } = await supabaseAdmin.rpc('affiliate_claim_stripe_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: eventObject.id ?? null,
  })
  requireDatabaseSuccess(error, 'affiliate_claim_stripe_event')
  return data === true
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  try {
    if (!await claimEvent(supabaseAdmin, event)) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    await processStripeEvent(event, stripe, supabaseAdmin)
    const { error } = await supabaseAdmin.rpc('affiliate_complete_stripe_event', { p_event_id: event.id })
    requireDatabaseSuccess(error, 'affiliate_complete_stripe_event')
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error'
    console.error('Stripe webhook processing failed:', event.id, message)
    const { error: ledgerError } = await supabaseAdmin.rpc('affiliate_fail_stripe_event', {
      p_event_id: event.id,
      p_error: message,
    })
    if (ledgerError) console.error('affiliate_fail_stripe_event failed:', ledgerError.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
