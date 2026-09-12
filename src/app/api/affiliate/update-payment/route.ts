import { NextResponse } from 'next/server'

/** Payment details are updated through the authenticated Server Action and the
 * update_affiliate_payment_method RPC so financial/profile columns stay locked. */
export async function POST() {
  return NextResponse.json(
    { error: 'Utilisez le formulaire sécurisé du programme d’affiliation.' },
    { status: 410 },
  )
}
