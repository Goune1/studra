import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase, isAdminEmail } from '@/lib/email-marketing'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/emails/campaigns/[id] — détail complet d'une campagne
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('marketing_email_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  return NextResponse.json({ campaign: data })
}

// PATCH /api/admin/emails/campaigns/[id] — mise à jour d'un draft
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  // Seuls les champs modifiables sur un draft
  const allowed = ['subject', 'html_body', 'prompt_history', 'recipient_filter', 'recipient_count']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const db = getAdminSupabase()
  const { error } = await db
    .from('marketing_email_campaigns')
    .update(update)
    .eq('id', id)
    .eq('status', 'draft')  // seulement les drafts

  if (error) {
    return NextResponse.json({ error: 'Erreur DB ou campagne non-draft' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/emails/campaigns/[id] — supprime un draft
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const db = getAdminSupabase()
  const { error } = await db
    .from('marketing_email_campaigns')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')  // seulement les drafts supprimables

  if (error) {
    return NextResponse.json({ error: 'Erreur DB ou campagne non-draft' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
