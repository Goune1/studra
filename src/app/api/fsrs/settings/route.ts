import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSettings, upsertUserSettings } from '@/lib/fsrs/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const settings = await getUserSettings(user.id, supabase)

  // Also return total review count for the optimization threshold display
  const { count } = await supabase
    .from('flashcard_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({ ...settings, total_reviews: count ?? 0 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { desired_retention, maximum_interval } = body as {
    desired_retention?: number
    maximum_interval?: number
  }

  const patch: { desired_retention?: number; maximum_interval?: number } = {}

  if (desired_retention !== undefined) {
    if (desired_retention < 0.7 || desired_retention > 0.98) {
      return NextResponse.json({ error: 'desired_retention doit être entre 0.70 et 0.98' }, { status: 400 })
    }
    patch.desired_retention = desired_retention
  }

  if (maximum_interval !== undefined) {
    if (maximum_interval < 1 || maximum_interval > 36500) {
      return NextResponse.json({ error: 'maximum_interval doit être entre 1 et 36500' }, { status: 400 })
    }
    patch.maximum_interval = maximum_interval
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun paramètre à mettre à jour' }, { status: 400 })
  }

  await upsertUserSettings(user.id, patch, supabase)
  return NextResponse.json({ ok: true })
}
