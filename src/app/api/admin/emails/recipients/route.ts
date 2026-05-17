import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail, getRecipientsPreview } from '@/lib/email-marketing'
import type { RecipientFilter } from '@/lib/email-marketing'

// GET /api/admin/emails/recipients?filter=<JSON encodé>
// Retourne { count, excluded, sample } pour prévisualiser les destinataires.
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const filterParam = searchParams.get('filter')

  let filter: RecipientFilter = { mode: 'all' }
  if (filterParam) {
    try {
      filter = JSON.parse(filterParam) as RecipientFilter
    } catch {
      return NextResponse.json({ error: 'Paramètre filter invalide' }, { status: 400 })
    }
  }

  const validModes = ['all', 'plan', 'custom_ids']
  if (!validModes.includes(filter.mode)) {
    return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
  }

  try {
    const info = await getRecipientsPreview(filter)
    return NextResponse.json(info)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
