import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase, isAdminEmail, generateEmailHtml } from '@/lib/email-marketing'
import type { PromptMessage } from '@/lib/email-marketing'

// POST /api/admin/emails/generate
// Body: { campaignId: string, userMessage: string }
// Génère ou itère le HTML de l'email via GPT-4o-mini.
// Stocke l'historique dans prompt_history pour itération conversationnelle.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.campaignId || !body?.userMessage?.trim()) {
    return NextResponse.json({ error: 'campaignId et userMessage requis' }, { status: 400 })
  }

  const { campaignId, userMessage } = body as { campaignId: string; userMessage: string }

  const db = getAdminSupabase()

  // Récupérer l'historique existant
  const { data: campaign, error: fetchErr } = await db
    .from('marketing_email_campaigns')
    .select('prompt_history, status')
    .eq('id', campaignId)
    .single()

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
  }

  if (campaign.status !== 'draft') {
    return NextResponse.json({ error: 'Seuls les drafts peuvent être régénérés' }, { status: 400 })
  }

  const history = (campaign.prompt_history ?? []) as PromptMessage[]

  console.log(JSON.stringify({ event: 'admin.emails.generate', campaignId, by: user!.email, turn: history.length / 2 + 1 }))

  let subject: string
  let html: string
  try {
    ;({ subject, html } = await generateEmailHtml(history, userMessage))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(JSON.stringify({ event: 'admin.emails.generate.error', campaignId, error: msg }))
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Mettre à jour l'historique et le contenu de la campagne
  const updatedHistory: PromptMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: JSON.stringify({ subject, html }) },
  ]

  const { error: updateErr } = await db
    .from('marketing_email_campaigns')
    .update({
      subject,
      html_body: html,
      prompt_history: updatedHistory,
    })
    .eq('id', campaignId)

  if (updateErr) {
    console.log(JSON.stringify({ event: 'admin.emails.generate.save_error', campaignId, error: updateErr.message }))
    return NextResponse.json({ error: 'Erreur de sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ subject, html })
}
