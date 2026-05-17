import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/email-marketing'
import { CampaignComposer } from '@/components/admin/emails/CampaignComposer'
import { EmailPreview } from '@/components/admin/emails/EmailPreview'
import { Sidebar } from '@/components/admin/Sidebar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { PromptMessage, RecipientFilter } from '@/lib/email-marketing'

export const metadata = { title: 'Campagne — Admin Studra' }

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  draft:   { label: 'Brouillon', dot: 'bg-gray-500',  text: 'text-gray-500'  },
  sending: { label: 'En cours',  dot: 'bg-blue-400',  text: 'text-blue-400'  },
  sent:    { label: 'Envoyé',    dot: 'bg-green-400', text: 'text-green-400' },
  failed:  { label: 'Échoué',    dot: 'bg-red-400',   text: 'text-red-400'   },
}

type Params = { params: Promise<{ id: string }> }

export default async function CampaignDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const db = getAdminSupabase()
  const { data: campaign } = await db
    .from('marketing_email_campaigns').select('*').eq('id', id).single()
  if (!campaign) notFound()

  const isDraft = campaign.status === 'draft'

  if (isDraft) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
        <Sidebar />
        <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen flex flex-col">
          <div className="flex items-center gap-3 px-5 pt-5 pb-0">
            <Link href="/admin/emails" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />Campagnes
            </Link>
            <span className="text-[#333] text-xs">/</span>
            <h1 className="text-sm font-semibold text-white truncate">{campaign.subject || 'Brouillon'}</h1>
          </div>
          <div className="flex-1 p-5">
            <CampaignComposer
              initialCampaignId={campaign.id}
              initialSubject={campaign.subject}
              initialHtml={campaign.html_body}
              initialHistory={(campaign.prompt_history ?? []) as PromptMessage[]}
              initialFilter={(campaign.recipient_filter ?? { mode: 'all' }) as RecipientFilter}
            />
          </div>
        </main>
      </div>
    )
  }

  // Vue lecture seule pour campagnes envoyées/en cours
  const st = STATUS[campaign.status] ?? STATUS.draft
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px]">
        <div className="p-5 max-w-[900px]">

          {/* Nav */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin/emails" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />Campagnes
            </Link>
            <span className="text-[#333] text-xs">/</span>
            <h1 className="text-sm font-semibold text-white truncate">{campaign.subject || '(sans objet)'}</h1>
            <div className="flex items-center gap-1.5 ml-1">
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              <span className={`font-mono text-[10px] ${st.text}`}>{st.label}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Ciblés', value: campaign.recipient_count?.toLocaleString('fr-FR') ?? '—', color: 'text-white' },
              { label: 'Envoyés', value: campaign.sent_count.toLocaleString('fr-FR'), color: 'text-green-400' },
              { label: 'Échecs', value: campaign.failed_count.toLocaleString('fr-FR'), color: campaign.failed_count > 0 ? 'text-red-400' : 'text-gray-600' },
              { label: 'Envoyé le', value: campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—', color: 'text-gray-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#222] bg-[#161616] px-4 py-3">
                <p className="font-mono text-[10px] text-gray-600 mb-1">{s.label}</p>
                <p className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-[#222] bg-[#161616] p-4 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-gray-600 mb-3">Preview</p>
            <EmailPreview subject={campaign.subject} html={campaign.html_body} height={600} />
          </div>

          {/* Error log */}
          {campaign.error_log?.length > 0 && (
            <details className="rounded-xl border border-red-900/30 bg-red-950/10 p-4">
              <summary className="cursor-pointer text-xs font-medium text-red-400">
                {campaign.error_log.length} erreur(s) d'envoi
              </summary>
              <ul className="mt-3 space-y-1">
                {campaign.error_log.slice(0, 50).map((e: { email: string; error: string }, i: number) => (
                  <li key={i} className="font-mono text-[10px] text-red-600">
                    <span>{e.email}</span> — {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </main>
    </div>
  )
}
