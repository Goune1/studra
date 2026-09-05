import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const referralCode = cookieStore.get('studra_ref')?.value
    const url = await createCheckoutSession(user.id, user.email!, referralCode)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors du checkout' }, { status: 500 })
  }
}
