// Usage: npx tsx scripts/encrypt-pronote-backfill.ts
// Idempotent backfill for legacy plaintext Pronote credentials/data.

import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { encryptToken, isEncrypted } from '../src/lib/crypto'

loadEnvConfig(process.cwd(), true, console, true)

function loadEnvLocalFallback() {
  const envPath = join(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvLocalFallback()

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PRONOTE_TOKEN_ENCRYPTION_KEY',
]
const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  throw new Error(`Missing required env vars: ${missingEnv.join(', ')}`)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

async function main() {
  const { data, error } = await supabase
    .from('pronote_connections')
    .select('id, refresh_token, username, raw_data')

  if (error) throw error

  console.log(`${data.length} rows to process`)

  let updated = 0
  let skipped = 0

  for (const row of data) {
    const updates: Record<string, string> = {}

    if (row.refresh_token && !isEncrypted(row.refresh_token)) {
      updates.refresh_token = encryptToken(row.refresh_token)
    }

    if (row.username && !isEncrypted(row.username)) {
      updates.username = encryptToken(row.username)
    }

    if (row.raw_data) {
      const asString = typeof row.raw_data === 'string' ? row.raw_data : JSON.stringify(row.raw_data)
      if (!isEncrypted(asString)) {
        updates.raw_data = encryptToken(asString)
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++
      continue
    }

    const { error: upErr } = await supabase
      .from('pronote_connections')
      .update(updates)
      .eq('id', row.id)

    if (upErr) {
      console.error(`Row ${row.id} failed:`, upErr)
      continue
    }

    updated++
  }

  console.log(`Done: ${updated} updated, ${skipped} skipped (already encrypted)`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
