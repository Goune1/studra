import { NextResponse } from 'next/server'
import { getAdminSupabase, verifyUnsubscribeToken } from '@/lib/email-marketing'

// POST /api/unsubscribe
// Body: { token: string }
// Vérifie la signature HMAC et passe marketing_consent=false sur l'utilisateur.
// Pas besoin d'être authentifié.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  }

  const decoded = verifyUnsubscribeToken(body.token as string)
  if (!decoded) {
    return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 })
  }

  const db = getAdminSupabase()
  const { error } = await db
    .from('profiles')
    .update({ marketing_consent: false })
    .eq('id', decoded.userId)

  if (error) {
    console.log(JSON.stringify({ event: 'unsubscribe.error', userId: decoded.userId, error: error.message }))
    return NextResponse.json({ error: 'Erreur lors de la désinscription' }, { status: 500 })
  }

  console.log(JSON.stringify({ event: 'unsubscribe.success', userId: decoded.userId, campaignId: decoded.campaignId }))
  return NextResponse.json({ ok: true })
}
