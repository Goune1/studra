/**
 * email-marketing.ts — Logique métier du module email marketing admin.
 *
 * Variables d'environnement requises :
 *   RESEND_API_KEY       — clé API Resend (déjà existante)
 *   RESEND_FROM_EMAIL    — ex: "Studra <hello@studra.fr>"
 *   UNSUBSCRIBE_SECRET   — 32 bytes hex aléatoires (openssl rand -hex 32)
 *   OPENAI_API_KEY       — clé API OpenAI (déjà existante)
 *   NEXT_PUBLIC_APP_URL  — ex: https://www.studra.fr
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL          — email de l'admin unique
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { resend } from '@/lib/resend'

// ── Types ────────────────────────────────────────────────────────────────────

export type RecipientMode = 'all' | 'plan' | 'custom_ids'

export interface RecipientFilter {
  mode: RecipientMode
  plan?: 'free' | 'pro' | null
  ids?: string[] | null  // UUIDs ou emails saisis manuellement
}

export interface PromptMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Campaign {
  id: string
  created_by: string
  subject: string
  html_body: string
  prompt_history: PromptMessage[]
  status: 'draft' | 'sending' | 'sent' | 'failed'
  recipient_filter: RecipientFilter
  recipient_count: number | null
  sent_count: number
  failed_count: number
  error_log: { email: string; error: string }[]
  created_at: string
  sent_at: string | null
}

export interface RecipientInfo {
  count: number
  excluded: number
  sample: { email: string; full_name: string | null }[]
}

// ── Clients ──────────────────────────────────────────────────────────────────

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.studra.fr'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Studra <hello@studra.fr>'

// ── Admin check helper ───────────────────────────────────────────────────────

export function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && !!email && email === adminEmail
}

// ── OpenAI email generation ──────────────────────────────────────────────────

const EMAIL_SYSTEM_PROMPT = `Tu es un expert en email marketing HTML pour la marque Studra (application d'apprentissage par IA pour étudiants).

Génère un email marketing professionnel selon la demande de l'admin.

RÈGLES STRICTES :
- HTML email-safe : utilise des tables HTML pour le layout (pas de flexbox, pas de grid, pas de CSS moderne)
- Tous les styles UNIQUEMENT en inline (attribut style="")
- Interdit : <script>, <link> externe, tout JavaScript, position:fixed, position:absolute
- Largeur max 600px, fond clair (#f4f4f5 ou #ffffff)
- Typographie : font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif
- Structure complète : <!DOCTYPE html>, <html>, <head>, <body>
- Footer OBLIGATOIRE contenant le texte "Se désinscrire" avec href="{{UNSUBSCRIBE_URL}}" (placeholder exact)
- Branding Studra : couleur principale #1a1a2e (header/CTA), texte corps #374151

FORMAT DE RÉPONSE : JSON strict, rien d'autre avant ou après :
{
  "subject": "Objet de l'email (accrocheur, max 60 caractères)",
  "html": "<!DOCTYPE html>..."
}`

export async function generateEmailHtml(
  history: PromptMessage[],
  userMessage: string,
): Promise<{ subject: string; html: string }> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: EMAIL_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
    { role: 'user', content: userMessage },
  ]

  async function attempt(msgs: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: msgs,
      response_format: { type: 'json_object' },
    })
    return res.choices[0].message.content ?? ''
  }

  let raw = await attempt(messages)

  let parsed: { subject: string; html: string } | null = null
  try {
    parsed = JSON.parse(raw) as { subject: string; html: string }
  } catch {
    // Retry avec instruction explicite
    raw = await attempt([
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: 'Réponds en JSON strict uniquement, rien d\'autre. Format: {"subject":"...","html":"..."}' },
    ])
    try {
      parsed = JSON.parse(raw) as { subject: string; html: string }
    } catch {
      throw new Error('OpenAI n\'a pas retourné un JSON valide après retry.')
    }
  }

  if (!parsed.subject || !parsed.html) {
    throw new Error('Réponse OpenAI incomplète : subject ou html manquant.')
  }

  return { subject: parsed.subject, html: parsed.html }
}

// ── Destinataires ────────────────────────────────────────────────────────────

export async function getRecipients(filter: RecipientFilter): Promise<{
  recipients: { id: string; email: string; full_name: string | null }[]
  excluded: number
}> {
  const db = getAdminSupabase()

  if (filter.mode === 'all') {
    const { data, error } = await db
      .from('profiles')
      .select('id, email, full_name')
      .eq('marketing_consent', true)
    if (error) throw error
    return { recipients: data ?? [], excluded: 0 }
  }

  if (filter.mode === 'plan') {
    const { data, error } = await db
      .from('profiles')
      .select('id, email, full_name')
      .eq('marketing_consent', true)
      .eq('plan', filter.plan ?? 'free')
    if (error) throw error
    return { recipients: data ?? [], excluded: 0 }
  }

  // custom_ids : liste d'UUIDs ou d'emails
  const ids = filter.ids ?? []
  if (ids.length === 0) return { recipients: [], excluded: 0 }

  const uuids = ids.filter((v) => UUID_RE.test(v))
  const emails = ids.filter((v) => !UUID_RE.test(v) && v.includes('@'))

  // Compter le total sans filtre consentement pour calculer les exclus
  const orFilter = buildOrFilter(uuids, emails)
  if (!orFilter) return { recipients: [], excluded: 0 }

  const [{ data: allMatched }, { data: consented }] = await Promise.all([
    db.from('profiles').select('id').or(orFilter),
    db.from('profiles').select('id, email, full_name').or(orFilter).eq('marketing_consent', true),
  ])

  const total = allMatched?.length ?? 0
  const withConsent = consented ?? []
  return { recipients: withConsent, excluded: total - withConsent.length }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function buildOrFilter(uuids: string[], emails: string[]): string | null {
  const parts: string[] = []
  if (uuids.length > 0) parts.push(`id.in.(${uuids.join(',')})`)
  if (emails.length > 0) parts.push(`email.in.(${emails.join(',')})`)
  return parts.length > 0 ? parts.join(',') : null
}

export async function getRecipientsPreview(filter: RecipientFilter): Promise<RecipientInfo> {
  const { recipients, excluded } = await getRecipients(filter)
  return {
    count: recipients.length,
    excluded,
    sample: recipients.slice(0, 10).map((r) => ({ email: r.email, full_name: r.full_name })),
  }
}

// ── Token unsubscribe ────────────────────────────────────────────────────────

export function generateUnsubscribeToken(userId: string, campaignId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET non configuré.')
  const payload = `${userId}:${campaignId}`
  const hmac = createHmac('sha256', secret).update(payload).digest('hex')
  const encodedPayload = Buffer.from(payload).toString('base64url')
  return `${encodedPayload}.${hmac}`
}

export function verifyUnsubscribeToken(token: string): { userId: string; campaignId: string } | null {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) return null

  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) return null

  const encodedPayload = token.slice(0, dotIdx)
  const hmac = token.slice(dotIdx + 1)

  let payload: string
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const colonIdx = payload.indexOf(':')
  if (colonIdx === -1) return null
  const userId = payload.slice(0, colonIdx)
  const campaignId = payload.slice(colonIdx + 1)
  if (!userId || !campaignId) return null

  const expectedHmac = createHmac('sha256', secret).update(payload).digest('hex')

  try {
    if (!timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) return null
  } catch {
    return null
  }

  return { userId, campaignId }
}

// ── Envoi des emails ─────────────────────────────────────────────────────────

export async function sendCampaign(campaignId: string): Promise<{
  sentCount: number
  failedCount: number
  errorLog: { email: string; error: string }[]
}> {
  const db = getAdminSupabase()

  const { data: campaign, error: fetchErr } = await db
    .from('marketing_email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (fetchErr || !campaign) throw new Error('Campagne introuvable.')
  if (campaign.status !== 'sending') throw new Error(`Statut inattendu: ${campaign.status}`)

  const { recipients } = await getRecipients(campaign.recipient_filter as RecipientFilter)

  let sentCount = 0
  let failedCount = 0
  const errorLog: { email: string; error: string }[] = []

  // Envoi par batchs de 100 avec 1s de délai entre chaque
  const batches = chunk(recipients, 100)

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) await sleep(1000)

    const batch = batches[i]
    const emails = batch.map((recipient) => {
      const token = generateUnsubscribeToken(recipient.id, campaignId)
      const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`
      const html = campaign.html_body.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl)

      return {
        from: FROM,
        to: recipient.email,
        subject: campaign.subject,
        html,
        replyTo: FROM,
      }
    })

    try {
      const result = await resend.batch.send(emails)
      // Resend batch.send retourne { data: { id }[] } — on vérifie les erreurs par email
      if (result.error) {
        // Erreur globale du batch
        batch.forEach((r) => {
          failedCount++
          errorLog.push({ email: r.email, error: result.error?.message ?? 'Erreur batch Resend' })
        })
      } else {
        sentCount += batch.length
      }
    } catch (err) {
      // Erreur réseau ou inattendue : on log chaque destinataire du batch
      const msg = err instanceof Error ? err.message : String(err)
      batch.forEach((r) => {
        failedCount++
        errorLog.push({ email: r.email, error: msg })
      })
    }
  }

  // Mise à jour finale du statut
  const finalStatus = sentCount === 0 && failedCount > 0 ? 'failed' : 'sent'
  await db
    .from('marketing_email_campaigns')
    .update({
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
      error_log: errorLog,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return { sentCount, failedCount, errorLog }
}

// ── Rate limiting ────────────────────────────────────────────────────────────

export async function checkDailySendLimit(adminUserId: string): Promise<boolean> {
  const db = getAdminSupabase()
  const { count } = await db
    .from('marketing_email_campaigns')
    .select('*', { count: 'exact', head: true })
    .in('status', ['sent', 'sending'])
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('created_by', adminUserId)

  return (count ?? 0) < 3
}

// ── Utilitaires ──────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
