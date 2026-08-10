import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const INVALID_LINK = 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip, 'auth:reset-password', 10, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  let body: { tokenHash?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 })
  }

  const tokenHash = typeof body.tokenHash === 'string' ? body.tokenHash : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!tokenHash) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 })
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir entre 8 et 72 caractères.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHash,
  })

  if (verifyError) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 })
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Impossible de mettre à jour le mot de passe. Réessayez.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
