import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase, isAdminEmail, sendCampaign, checkDailySendLimit, getRecipients } from '@/lib/email-marketing'

// 5 minutes pour l'envoi synchrone. Au-delà de ~5000 destinataires, préférer Inngest/QStash.
// TODO: pour les envois > 5000 destinataires, migrer vers une queue async (Inngest ou QStash)
export const maxDuration = 300

const MAX_SYNC_RECIPIENTS = 5000

// POST /api/admin/emails/send
// Body: { campaignId: string, confirm: true }
// Lance l'envoi de la campagne. Idempotent si déjà en statut 'sending'.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.campaignId) {
    return NextResponse.json({ error: 'campaignId requis' }, { status: 400 })
  }
  if (body.confirm !== true) {
    return NextResponse.json({ error: 'confirm:true requis pour lancer l\'envoi' }, { status: 400 })
  }

  const { campaignId } = body as { campaignId: string }
  const db = getAdminSupabase()

  // Vérifier que la campagne est un draft
  const { data: campaign, error: fetchErr } = await db
    .from('marketing_email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
  }

  if (campaign.status !== 'draft') {
    return NextResponse.json({ error: `Campagne en statut "${campaign.status}", seuls les drafts peuvent être envoyés` }, { status: 400 })
  }

  if (!campaign.subject?.trim() || !campaign.html_body?.trim()) {
    return NextResponse.json({ error: 'La campagne doit avoir un subject et un html_body' }, { status: 400 })
  }

  // Rate limit : max 3 envois par 24h
  const withinLimit = await checkDailySendLimit(user!.id)
  if (!withinLimit) {
    return NextResponse.json({ error: 'Limite atteinte : max 3 envois de campagne par 24h' }, { status: 429 })
  }

  // Recalculer les destinataires (ne pas faire confiance au count stocké)
  const { recipients } = await getRecipients(campaign.recipient_filter)

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire avec marketing_consent=true pour ce filtre' }, { status: 400 })
  }

  if (recipients.length > MAX_SYNC_RECIPIENTS) {
    return NextResponse.json({
      error: `${recipients.length} destinataires dépassent la limite synchrone (${MAX_SYNC_RECIPIENTS}). Découpez la campagne ou utilisez une queue async (Inngest/QStash).`,
    }, { status: 400 })
  }

  // Passer en statut 'sending' et mettre à jour le count réel
  const { error: statusErr } = await db
    .from('marketing_email_campaigns')
    .update({ status: 'sending', recipient_count: recipients.length })
    .eq('id', campaignId)
    .eq('status', 'draft')  // guard contre double-envoi concurrent

  if (statusErr) {
    return NextResponse.json({ error: 'Impossible de verrouiller la campagne pour envoi' }, { status: 500 })
  }

  console.log(JSON.stringify({ event: 'admin.emails.send.start', campaignId, recipients: recipients.length, by: user!.email }))

  try {
    const result = await sendCampaign(campaignId)
    console.log(JSON.stringify({ event: 'admin.emails.send.done', campaignId, ...result }))
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(JSON.stringify({ event: 'admin.emails.send.error', campaignId, error: msg }))
    // Repasser en failed si erreur inattendue
    await db
      .from('marketing_email_campaigns')
      .update({ status: 'failed' })
      .eq('id', campaignId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
