import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAffiliateByCode, recordAffiliateClick } from '@/lib/affiliate'
import { signAffiliateCookie, verifyAffiliateCookie } from '@/lib/affiliate-cookie'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const COOKIE_NAME = 'studra_ref'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const CODE_PATTERN = /^[a-z0-9]{4,20}$/

function normalizedCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return CODE_PATTERN.test(code) ? code : ''
}

function safeDestination(requestUrl: URL): URL {
  const next = requestUrl.searchParams.get('next') ?? '/'
  const pathname = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return new URL(pathname, requestUrl.origin)
}

function clickDedupeKey(request: Request, affiliateId: string): string {
  const hourBucket = Math.floor(Date.now() / 3_600_000)
  const fingerprint = [
    affiliateId,
    getClientIp(request),
    request.headers.get('user-agent')?.slice(0, 256) ?? '',
    hourBucket,
  ].join('|')
  const secret = process.env.AFFILIATE_COOKIE_SECRET
  if (!secret || secret.length < 32) throw new Error('AFFILIATE_COOKIE_SECRET must be at least 32 characters')
  return createHmac('sha256', secret).update(fingerprint).digest('hex')
}

function setReferralCookie(response: NextResponse, request: NextRequest, code: string): void {
  // First-touch: an existing valid attribution cannot be overwritten by a later click.
  if (verifyAffiliateCookie(request.cookies.get(COOKIE_NAME)?.value)) return
  response.cookies.set(COOKIE_NAME, signAffiliateCookie(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

async function track(request: Request, code: string): Promise<{ ok: true } | { ok: false; status: number }> {
  if (!code) return { ok: false, status: 400 }
  const ip = getClientIp(request)
  if (!await checkRateLimit(ip, 'affiliate:track', 30, 3600)) {
    return { ok: false, status: 429 }
  }

  const affiliate = await getAffiliateByCode(code)
  if (!affiliate) return { ok: false, status: 404 }
  await recordAffiliateClick(affiliate.id, clickDedupeKey(request, affiliate.id))
  return { ok: true }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = normalizedCode(url.searchParams.get('ref'))
  const result = await track(request, code)
  const destination = safeDestination(url)
  if (!result.ok) destination.searchParams.set('ref_error', String(result.status))

  const response = NextResponse.redirect(destination)
  if (result.ok) setReferralCookie(response, request, code)
  return response
}

export async function POST(request: NextRequest) {
  let body: { ref?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const code = normalizedCode(body.ref)
  try {
    const result = await track(request, code)
    if (!result.ok) return NextResponse.json({ ok: false }, { status: result.status })
    const response = NextResponse.json({ ok: true })
    setReferralCookie(response, request, code)
    return response
  } catch (error) {
    console.error('Affiliate tracking failed:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
