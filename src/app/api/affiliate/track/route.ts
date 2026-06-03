import { NextResponse } from 'next/server'
import { getAffiliateByCode, recordAffiliateClick } from '@/lib/affiliate'
import { createHash } from 'crypto'
import { getClientIp } from '@/lib/rate-limit'

const COOKIE_NAME = 'studra_ref'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 jours

export async function POST(request: Request) {
  let body: { ref?: unknown; visitorId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const code = typeof body.ref === 'string' ? body.ref.trim().toLowerCase() : ''
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.slice(0, 64) : null

  if (!code || !/^[a-z0-9]{4,20}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 })
  }

  const affiliate = await getAffiliateByCode(code)
  if (!affiliate) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  // Hachage de l'IP pour analytics anonyme (pas stocké en clair)
  const ip = getClientIp(request)
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 16) : null
  const userAgent = request.headers.get('user-agent')?.slice(0, 256) ?? null

  await recordAffiliateClick(affiliate.id, visitorId, ipHash, userAgent)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, code, {
    httpOnly: false, // doit être lisible par JS pour l'afficher dans l'UI si besoin
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('ref')?.trim().toLowerCase() ?? ''

  if (!code || !/^[a-z0-9]{4,20}$/.test(code)) {
    return NextResponse.json({ valid: false })
  }

  const affiliate = await getAffiliateByCode(code)
  return NextResponse.json({ valid: !!affiliate })
}
