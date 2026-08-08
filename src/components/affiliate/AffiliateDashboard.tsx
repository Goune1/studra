'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, Check, Users, MousePointer, TrendingUp, Wallet } from 'lucide-react'
import { updatePaymentMethod } from '@/app/[locale]/(dashboard)/affiliate/actions'
import type { Affiliate, AffiliateCommission, AffiliatePayout, AffiliateStats } from '@/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'text-yellow-400' },
  approved:  { label: 'Validée',     color: 'text-blue-400' },
  payable:   { label: 'Payable',     color: 'text-green-400' },
  paid:      { label: 'Payée',       color: 'text-gray-400' },
  cancelled: { label: 'Annulée',     color: 'text-red-400' },
  refunded:  { label: 'Remboursée',  color: 'text-orange-400' },
}

function fmt(v: number) {
  return v.toFixed(2).replace('.', ',') + ' €'
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  affiliate: Affiliate
  stats: AffiliateStats
  commissions: AffiliateCommission[]
  payouts: AffiliatePayout[]
  appUrl: string
  minimumPayoutThreshold: number
}

export function AffiliateDashboard({ affiliate, stats, commissions, payouts, appUrl, minimumPayoutThreshold }: Props) {
  const [copied, setCopied] = useState(false)
  const [editPayment, setEditPayment] = useState(false)
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>(affiliate.payment_method ?? 'paypal')
  const [isPending, startTransition] = useTransition()

  const link = `${appUrl}/?ref=${affiliate.referral_code}`

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePaymentUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePaymentMethod(formData)
      if (result.ok) {
        toast.success('Moyen de paiement mis à jour.')
        setEditPayment(false)
      } else {
        toast.error(result.error ?? 'Erreur.')
      }
    })
  }

  const kpis = [
    { label: 'Clics',           value: stats.total_clicks,       icon: MousePointer, color: '#8B5CF6' },
    { label: 'Inscriptions',    value: stats.total_referrals,     icon: Users,        color: '#3B82F6' },
    { label: 'Abonnés actifs',  value: stats.active_subscribers,  icon: TrendingUp,   color: '#10B981' },
    { label: 'Commissions dues', value: fmt(stats.commission_pending + stats.commission_approved + stats.commission_payable), icon: Wallet, color: '#F59E0B' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Programme d'affiliation</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
          {affiliate.status === 'suspended'
            ? '⚠️ Votre compte est suspendu. Contactez le support.'
            : `Bonjour ${affiliate.first_name} ! Voici votre tableau de bord.`}
        </p>
      </div>

      {/* Lien de parrainage */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Votre lien de parrainage</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 font-mono truncate">
            {link}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors shrink-0"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">Code : <span className="font-mono text-gray-400">{affiliate.referral_code}</span></p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold">{typeof value === 'number' ? value : value}</p>
          </div>
        ))}
      </div>

      {/* Solde détaillé */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Solde des commissions</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'En attente',    value: stats.commission_pending,  note: 'En cours de validation' },
            { label: 'Validées',      value: stats.commission_approved, note: 'Prêtes à verser' },
            { label: 'Payables',      value: stats.commission_payable,  note: `Seuil : ${minimumPayoutThreshold} €` },
            { label: 'Payées',        value: stats.commission_paid,     note: 'Total versé' },
          ].map(({ label, value, note }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold">{fmt(value)}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{note}</p>
            </div>
          ))}
        </div>
        {(stats.commission_payable) < minimumPayoutThreshold && (stats.commission_payable) > 0 && (
          <p className="text-xs text-yellow-400 mt-4">
            Il vous manque {fmt(minimumPayoutThreshold - stats.commission_payable)} pour atteindre le seuil de paiement.
          </p>
        )}
      </div>

      {/* Historique commissions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold">Historique des commissions</h2>
        </div>
        {commissions.length === 0 ? (
          <p className="text-sm text-gray-500 p-6">Aucune commission pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Revenu', 'Commission', 'Statut'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-mono text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const st = STATUS_LABELS[c.status] ?? { label: c.status, color: 'text-gray-400' }
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{fmtDate(c.created_at)}</td>
                    <td className="px-5 py-3 text-xs">{fmt(c.amount_revenue)}</td>
                    <td className="px-5 py-3 text-sm font-semibold">{fmt(c.amount_commission)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-mono ${st.color}`}>{st.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historique paiements */}
      {payouts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold">Historique des paiements</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Montant', 'Méthode', 'Référence', 'Statut'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-mono text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">{fmtDate(p.created_at)}</td>
                  <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{p.payment_method === 'paypal' ? 'PayPal' : 'Virement'}</td>
                  <td className="px-5 py-3 text-xs font-mono text-gray-500">{p.payment_reference ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono ${p.status === 'paid' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {p.status === 'paid' ? 'Payé' : p.status === 'failed' ? 'Échoué' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Méthode de paiement */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Méthode de paiement</h2>
          {!editPayment && (
            <button
              onClick={() => setEditPayment(true)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>

        {!editPayment ? (
          <div className="text-sm text-gray-300">
            {affiliate.payment_method === 'paypal' ? (
              <p>💳 PayPal — <span className="font-mono text-gray-400">{affiliate.paypal_email}</span></p>
            ) : affiliate.payment_method === 'bank_transfer' ? (
              <div className="space-y-1">
                <p>🏦 Virement — <span className="font-mono text-gray-400">{affiliate.iban}</span></p>
                {affiliate.bic && <p className="text-xs text-gray-500">BIC : {affiliate.bic}</p>}
                <p className="text-xs text-gray-500">Titulaire : {affiliate.account_holder_name}</p>
              </div>
            ) : (
              <p className="text-gray-500">Non renseigné</p>
            )}
          </div>
        ) : (
          <form onSubmit={handlePaymentUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['paypal', 'bank_transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                    method === m
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {m === 'paypal' ? '💳 PayPal' : '🏦 Virement bancaire'}
                </button>
              ))}
            </div>
            <input type="hidden" name="payment_method" value={method} />

            {method === 'paypal' ? (
              <input
                name="paypal_email"
                type="email"
                required
                defaultValue={affiliate.paypal_email ?? ''}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
                placeholder="Email PayPal"
              />
            ) : (
              <div className="space-y-3">
                <input
                  name="account_holder_name"
                  required
                  defaultValue={affiliate.account_holder_name ?? ''}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="Titulaire du compte"
                />
                <input
                  name="iban"
                  required
                  defaultValue={affiliate.iban ?? ''}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors font-mono"
                  placeholder="IBAN"
                />
                <input
                  name="bic"
                  defaultValue={affiliate.bic ?? ''}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors font-mono"
                  placeholder="BIC / SWIFT (optionnel)"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
              >
                {isPending ? 'Mise à jour...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditPayment(false)}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
