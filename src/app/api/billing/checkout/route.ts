import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, hasCurrentSubscription } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 })
  }

  try {
    if (profile.stripe_subscription_id && await hasCurrentSubscription(profile.stripe_subscription_id)) {
      return NextResponse.json(
        { error: 'Un abonnement est déjà actif pour ce compte.' },
        { status: 409 },
      )
    }

    const url = await createCheckoutSession(
      user.id,
      user.email,
      profile.stripe_customer_id,
    )
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Erreur lors du checkout' }, { status: 500 })
  }
}
