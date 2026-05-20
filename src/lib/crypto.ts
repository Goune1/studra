import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const VERSION = 'v1'

function getKey(): Buffer {
  const hex = process.env.PRONOTE_TOKEN_ENCRYPTION_KEY
  if (!hex) throw new Error('PRONOTE_TOKEN_ENCRYPTION_KEY missing')

  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) {
    throw new Error('PRONOTE_TOKEN_ENCRYPTION_KEY must be 32 bytes hex (64 hex chars)')
  }

  return buf
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [VERSION, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.')
}

export function decryptToken(encoded: string): string {
  if (!encoded) return encoded

  const parts = encoded.split('.')
  if (parts[0] !== VERSION || parts.length !== 4) {
    return encoded
  }

  const [, ivB64, tagB64, ctB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(`${VERSION}.`)
}
