import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { BacClient } from './client'
import { BacGate } from './bac-gate'

export default async function BacPage() {
  const cookieStore = await cookies()
  const access = cookieStore.get('bac_beta_access')
  const expected = process.env.BAC_BETA_PASSWORD
  const expectedHash = expected
    ? createHash('sha256').update(expected).digest('hex')
    : null

  if (!expectedHash || access?.value !== expectedHash) {
    return <BacGate />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: connection } = user
    ? await supabase
        .from('pronote_connections')
        .select('instance_url, username, last_synced_at, raw_data')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  return (
    <BacClient
      initialConnection={
        connection as {
          instance_url: string
          username: string
          last_synced_at: string | null
          raw_data: unknown
        } | null
      }
    />
  )
}
