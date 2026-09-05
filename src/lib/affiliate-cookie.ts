import { createHmac, timingSafeEqual } from 'crypto'

const CODE_PATTERN = /^[a-z0-9]{4,20}$/

function secret(): string {
  const value = process.env.AFFILIATE_COOKIE_SECRET
  if (!value || value.length < 32) {
    throw new Error('AFFILIATE_COOKIE_SECRET must contain at least 32 characters')
  }
  return value
}

function signature(code: string): string {
  return createHmac('sha256', secret()).update(code).digest('base64url')
}

export function signAffiliateCookie(code: string): string {
  const normalized = code.trim().toLowerCase()
  if (!CODE_PATTERN.test(normalized)) throw new Error('Invalid affiliate code')
  return `${normalized}.${signature(normalized)}`
}

export function verifyAffiliateCookie(value: string | undefined): string | null {
  if (!value) return null
  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null
  const code = value.slice(0, separator)
  const received = value.slice(separator + 1)
  if (!CODE_PATTERN.test(code)) return null

  try {
    const expected = signature(code)
    const receivedBuffer = Buffer.from(received)
    const expectedBuffer = Buffer.from(expected)
    if (receivedBuffer.length !== expectedBuffer.length) return null
    return timingSafeEqual(receivedBuffer, expectedBuffer) ? code : null
  } catch {
    return null
  }
}
