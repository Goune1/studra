import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase, isAdminEmail } from '@/lib/email-marketing'

// GET /api/admin/emails/campaigns — liste toutes les campagnes (plus récentes en premier)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('marketing_email_campaigns')
    .select('id, subject, status, recipient_count, sent_count, failed_count, created_at, sent_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.log(JSON.stringify({ event: 'admin.campaigns.list.error', error: error.message }))
    return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
  }

  return NextResponse.json({ campaigns: data })
}

// POST /api/admin/emails/campaigns — crée une campagne draft vide
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const recipientFilter = body.recipient_filter ?? { mode: 'all' }

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('marketing_email_campaigns')
    .insert({
      created_by: user!.id,
      subject: '',
      html_body: '',
      prompt_history: [],
      status: 'draft',
      recipient_filter: recipientFilter,
    })
    .select('id')
    .single()

  if (error) {
    console.log(JSON.stringify({ event: 'admin.campaigns.create.error', error: error.message }))
    return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
  }

  console.log(JSON.stringify({ event: 'admin.campaigns.created', campaignId: data.id, by: user!.email }))
  return NextResponse.json({ id: data.id }, { status: 201 })
}
