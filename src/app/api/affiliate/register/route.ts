import { NextResponse } from 'next/server'

/** Affiliate enrolment is a Server Action backed by the register_affiliate RPC.
 * The former JSON endpoint duplicated validation and enabled direct table writes. */
export async function POST() {
  return NextResponse.json(
    { error: 'Utilisez le formulaire sécurisé du programme d’affiliation.' },
    { status: 410 },
  )
}
