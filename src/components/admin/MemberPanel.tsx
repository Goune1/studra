'use client'

import { useState, useCallback } from 'react'
import { X, Copy, Check, ExternalLink, RotateCcw } from 'lucide-react'
import { AdminUser, Plan, StripeStatus } from '@/lib/admin/mock-data'

// ─── helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-blue-600',   'bg-rose-600',   'bg-amber-600',
  'bg-cyan-600',   'bg-pink-600',
]

function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function PlanBadge({ plan }: { plan: Plan }) {
  return plan === 'pro'
    ? <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30">PRO</span>
    : <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-500">FREE</span>
}

function StatusBadge({ status }: { status: StripeStatus }) {
  const map: Record<StripeStatus, { cls: string; label: string }> = {
    active:   { cls: 'bg-green-500/15 text-green-400 border-green-500/30',  label: 'active'   },
    trialing: { cls: 'bg-blue-500/15  text-blue-400  border-blue-500/30',   label: 'trialing' },
    canceled: { cls: 'bg-red-500/15   text-red-400   border-red-500/30',    label: 'canceled' },
    past_due: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  label: 'past_due' },
    none:     { cls: 'bg-[#222] text-gray-500 border-[#333]',               label: 'none'     },
  }
  const { cls, label } = map[status]
  return (
    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${cls} inline-flex items-center gap-1`}>
      {status === 'past_due' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {label}
    </span>
  )
}

const GEN_TYPE_LABEL: Record<string, string> = {
  flashcards: '🃏 Flashcards',
  fiche:      '📄 Fiche',
  schema:     '🗺️ Schéma',
  frise:      '📅 Frise',
  examen:     '📝 Examen',
}

// ─── component ────────────────────────────────────────────────────────────────
interface Props {
  member:  AdminUser | null
  onClose: () => void
}

export function MemberPanel({ member, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <>
      {/* Overlay */}
      {member && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-[#111111] border-l border-[#222222] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          member ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {!member ? null : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#222222] shrink-0">
              <div className={`w-10 h-10 rounded-full ${avatarColor(member.name)} flex items-center justify-center shrink-0`}>
                <span className="font-mono text-sm font-bold text-white">{initials(member.name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{member.name}</p>
                <p className="font-mono text-xs text-gray-500 truncate">{member.email}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-[#222] transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {/* Compte */}
              <section>
                <h3 className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-3">Compte</h3>
                <div className="space-y-2">
                  <Row label="ID utilisateur">
                    <CopyField value={member.id} copyKey="id" copied={copied} onCopy={copy} mono />
                  </Row>
                  <Row label="Inscrit le">
                    <span className="font-mono text-xs text-gray-300">{fmtDate(member.createdAt)}</span>
                  </Row>
                  <Row label="Dernière connexion">
                    <span className="font-mono text-xs text-gray-300">{fmtDateTime(member.lastLoginAt)}</span>
                  </Row>
                </div>
              </section>

              <Divider />

              {/* Abonnement */}
              <section>
                <h3 className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-3">Abonnement</h3>
                <div className="space-y-2">
                  <Row label="Plan"><PlanBadge plan={member.plan} /></Row>
                  <Row label="Statut Stripe"><StatusBadge status={member.stripeStatus} /></Row>
                  <Row label="Customer ID">
                    {member.stripeCustomerId
                      ? <CopyField value={member.stripeCustomerId} copyKey="cus" copied={copied} onCopy={copy} mono />
                      : <span className="font-mono text-xs text-gray-600">—</span>
                    }
                  </Row>
                  <Row label="Début">
                    <span className="font-mono text-xs text-gray-300">{fmtDate(member.stripeStartDate)}</span>
                  </Row>
                  <Row label={member.stripeCancelDate ? 'Annulé le' : 'Prochain renouvellement'}>
                    <span className={`font-mono text-xs ${member.stripeCancelDate ? 'text-red-400' : 'text-gray-300'}`}>
                      {fmtDate(member.stripeCancelDate ?? member.stripeNextRenewal)}
                    </span>
                  </Row>
                </div>
              </section>

              <Divider />

              {/* Utilisation */}
              <section>
                <h3 className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-3">Utilisation ce mois</h3>
                <div className="space-y-2 mb-4">
                  <Row label="Générations">
                    <span className="font-mono text-xs text-gray-300 tabular-nums">
                      {member.generationsUsed}
                      {isFinite(member.generationsQuota) ? ` / ${member.generationsQuota}` : ' / ∞'}
                    </span>
                  </Row>
                  {isFinite(member.generationsQuota) && (
                    <Row label="Quota restant">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (member.generationsUsed / member.generationsQuota) >= 1 ? 'bg-red-500'
                              : (member.generationsUsed / member.generationsQuota) >= 0.8 ? 'bg-amber-500'
                              : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((member.generationsUsed / member.generationsQuota) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-gray-400">
                          {Math.max(member.generationsQuota - member.generationsUsed, 0)} restante(s)
                        </span>
                      </div>
                    </Row>
                  )}
                </div>

                {/* Recent generations */}
                {member.recentGenerations.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-gray-600 mb-2">5 dernières générations</p>
                    <div className="space-y-1">
                      {member.recentGenerations.slice(0, 5).map((gen, i) => (
                        <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-[#1a1a1a] border border-[#222]">
                          <span className="text-xs text-gray-300">{GEN_TYPE_LABEL[gen.type]}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-gray-600 uppercase">{gen.lang}</span>
                            <span className="font-mono text-[10px] text-gray-600">{fmtDate(gen.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <Divider />

              {/* Contenu créé */}
              <section>
                <h3 className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-3">Contenu créé</h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Decks',   count: member.contentCounts.decks   },
                    { label: 'Fiches',  count: member.contentCounts.fiches  },
                    { label: 'Schémas', count: member.contentCounts.schemas },
                    { label: 'Frises',  count: member.contentCounts.frises  },
                  ] as const).map(({ label, count }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded bg-[#1a1a1a] border border-[#222]">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="font-mono text-sm font-semibold text-white tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Footer actions ── */}
            <div className="px-5 py-4 border-t border-[#222222] flex items-center gap-2 shrink-0">
              {member.plan === 'free' && (
                <button className="flex items-center gap-2 h-8 px-3 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors text-xs font-mono">
                  <RotateCcw size={12} />
                  Réinitialiser le quota
                </button>
              )}
              {member.stripeCustomerId && (
                <a
                  href={`https://dashboard.stripe.com/customers/${member.stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-8 px-3 rounded border border-[#333] text-gray-400 hover:text-gray-200 hover:border-[#444] transition-colors text-xs font-mono ml-auto"
                >
                  Voir dans Stripe
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── small sub-components ─────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-mono text-[11px] text-gray-600 shrink-0 pt-0.5">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-[#1e1e1e]" />
}

interface CopyFieldProps {
  value:   string
  copyKey: string
  copied:  string | null
  onCopy:  (text: string, key: string) => Promise<void>
  mono?:   boolean
}

function CopyField({ value, copyKey, copied, onCopy, mono }: CopyFieldProps) {
  return (
    <button
      onClick={() => onCopy(value, copyKey)}
      className="flex items-center gap-1.5 group"
      title="Copier"
    >
      <span className={`${mono ? 'font-mono' : ''} text-xs text-gray-300 group-hover:text-white transition-colors truncate max-w-[180px]`}>
        {value}
      </span>
      <span className="shrink-0 text-gray-600 group-hover:text-gray-300 transition-colors">
        {copied === copyKey ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      </span>
      {copied === copyKey && (
        <span className="font-mono text-[10px] text-green-400">Copié !</span>
      )}
    </button>
  )
}
