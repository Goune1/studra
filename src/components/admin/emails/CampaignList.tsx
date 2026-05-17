import Link from 'next/link'
import { getAdminSupabase } from '@/lib/email-marketing'
import { Mail, Plus, Send, Clock, FileText, AlertCircle } from 'lucide-react'

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  draft:   { label: 'Brouillon', dot: 'bg-gray-500',   text: 'text-gray-500'  },
  sending: { label: 'En cours',  dot: 'bg-blue-400',   text: 'text-blue-400'  },
  sent:    { label: 'Envoyé',    dot: 'bg-green-400',  text: 'text-green-400' },
  failed:  { label: 'Échoué',    dot: 'bg-red-400',    text: 'text-red-400'   },
}

const STATUS_ICON: Record<string, React.ElementType> = {
  draft: FileText, sending: Clock, sent: Send, failed: AlertCircle,
}

export async function CampaignList() {
  const db = getAdminSupabase()
  const { data: campaigns } = await db
    .from('marketing_email_campaigns')
    .select('id, subject, status, recipient_count, sent_count, failed_count, created_at, sent_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Campagnes email</h1>
          <p className="font-mono text-xs text-gray-600 mt-0.5">
            {campaigns?.length ?? 0} campagne{(campaigns?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/emails/new"
          className="flex items-center gap-1.5 rounded-lg bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle campagne
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#222] bg-[#161616] py-20 text-gray-600">
          <Mail className="mb-3 h-9 w-9 opacity-40" />
          <p className="text-sm">Aucune campagne pour l'instant</p>
          <Link href="/admin/emails/new" className="mt-3 text-xs font-medium text-gray-400 hover:text-white underline underline-offset-2 transition-colors">
            Créer la première campagne →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl border border-[#222] bg-[#161616] divide-y divide-[#1e1e1e]">
          {campaigns.map((c) => {
            const st = STATUS[c.status] ?? STATUS.draft
            const Icon = STATUS_ICON[c.status] ?? FileText
            return (
              <Link
                key={c.id}
                href={`/admin/emails/${c.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#222] flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                      {c.subject || <span className="text-gray-600 italic">Sans objet</span>}
                    </p>
                    <p className="font-mono text-[10px] text-gray-600 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {c.sent_at && ` · envoyé le ${new Date(c.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  {c.status === 'sent' && (
                    <span className="font-mono text-[10px] text-gray-600">
                      {c.sent_count?.toLocaleString('fr-FR')} envoyés
                      {c.failed_count ? ` · ${c.failed_count} échecs` : ''}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className={`font-mono text-[10px] ${st.text}`}>{st.label}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
