'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Sidebar } from '@/components/admin/Sidebar'

function fmt(v: number) {
  return v.toFixed(2).replace('.', ',') + ' €'
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

type Affiliate = {
  id: string; referral_code: string; commission_rate: number; status: string
  first_name: string; last_name: string; contact_email: string
  payment_method: string | null; paypal_email: string | null
  iban: string | null; bic: string | null; account_holder_name: string | null
  created_at: string
}
type Commission = { id: string; amount_revenue: number; amount_commission: number; status: string; stripe_invoice_id: string; created_at: string }
type Payout = { id: string; amount: number; payment_method: string; payment_reference: string | null; status: string; paid_at: string | null; created_at: string }
type Referral = { id: string; referred_user_id: string; created_at: string; profiles: { email: string; full_name: string | null; plan: string } | null }

const COMM_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: 'text-yellow-400' },
  approved:  { label: 'Validée',    color: 'text-blue-400' },
  payable:   { label: 'Payable',    color: 'text-green-400' },
  paid:      { label: 'Payée',      color: 'text-gray-400' },
  cancelled: { label: 'Annulée',    color: 'text-red-400' },
  refunded:  { label: 'Remboursée', color: 'text-orange-400' },
}

export default function AdminAffiliatePage() {
  const params = useParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<{
    affiliate: Affiliate
    commissions: Commission[]
    payouts: Payout[]
    referrals: Referral[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('paypal')
  const [payoutRef, setPayoutRef] = useState('')

  useEffect(() => {
    fetch(`/api/admin/affiliates/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setCommissionRate(String(d.affiliate?.commission_rate ?? 20))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex">
        <Sidebar />
        <main className="flex-1 ml-12 xl:ml-[220px] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Chargement...</p>
        </main>
      </div>
    )
  }

  if (!data?.affiliate) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex">
        <Sidebar />
        <main className="flex-1 ml-12 xl:ml-[220px] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Affilié introuvable.</p>
        </main>
      </div>
    )
  }

  const { affiliate, commissions, payouts, referrals } = data

  const payableAmount = commissions.filter(c => c.status === 'payable').reduce((s, c) => s + Number(c.amount_commission), 0)

  function updateStatus(status: 'active' | 'suspended') {
    startTransition(async () => {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Statut mis à jour : ${status}`)
        setData(d => d ? { ...d, affiliate: { ...d.affiliate, status } } : d)
      } else {
        toast.error('Erreur lors de la mise à jour.')
      }
    })
  }

  function updateRate() {
    const rate = Number(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Taux invalide (0-100).')
      return
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_rate: rate }),
      })
      if (res.ok) {
        toast.success('Taux mis à jour.')
        setData(d => d ? { ...d, affiliate: { ...d.affiliate, commission_rate: rate } } : d)
      } else {
        toast.error('Erreur.')
      }
    })
  }

  function recordPayout() {
    const amount = Number(payoutAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Montant invalide.'); return }

    startTransition(async () => {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, payment_method: payoutMethod, payment_reference: payoutRef || null }),
      })
      if (res.ok) {
        toast.success('Paiement enregistré.')
        router.refresh()
        // Reload data
        fetch(`/api/admin/affiliates/${affiliate.id}`).then(r => r.json()).then(setData)
        setPayoutAmount('')
        setPayoutRef('')
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen">
        <div className="p-5 max-w-[1200px] space-y-6">

          <div className="flex items-center gap-3">
            <Link href="/admin/affiliates" className="text-gray-500 hover:text-gray-300 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-base font-semibold text-white">{affiliate.first_name} {affiliate.last_name}</h1>
              <p className="font-mono text-[10px] text-gray-600">{affiliate.contact_email} · code: {affiliate.referral_code}</p>
            </div>
            <span className={`ml-auto font-mono text-[10px] px-2 py-0.5 rounded ${affiliate.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {affiliate.status === 'active' ? 'Actif' : 'Suspendu'}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Coordonnées de paiement */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 space-y-3">
              <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Coordonnées de paiement</h2>
              {affiliate.payment_method === 'paypal' ? (
                <p className="text-sm">💳 PayPal — <span className="font-mono text-violet-400">{affiliate.paypal_email}</span></p>
              ) : affiliate.payment_method === 'bank_transfer' ? (
                <div className="space-y-1 text-sm">
                  <p>🏦 Virement</p>
                  <p className="font-mono text-[11px] text-violet-400">{affiliate.iban}</p>
                  {affiliate.bic && <p className="text-xs text-gray-500">BIC : {affiliate.bic}</p>}
                  <p className="text-xs text-gray-500">Titulaire : {affiliate.account_holder_name}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Non renseigné</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
              <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Actions</h2>

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(affiliate.status === 'active' ? 'suspended' : 'active')}
                  disabled={isPending}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    affiliate.status === 'active'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {affiliate.status === 'active' ? 'Suspendre' : 'Réactiver'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={e => setCommissionRate(e.target.value)}
                  min={0} max={100} step={0.5}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white focus:outline-none focus:border-violet-500/50"
                  placeholder="Taux (%)"
                />
                <button
                  onClick={updateRate}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold transition-colors"
                >
                  Mettre à jour le taux
                </button>
              </div>
            </div>
          </div>

          {/* Enregistrer un paiement */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Enregistrer un paiement manuel</h2>
              {payableAmount > 0 && (
                <span className="font-mono text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                  Payable : {fmt(payableAmount)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
              <input
                type="number"
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder="Montant (€)"
                className="px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
              <select
                value={payoutMethod}
                onChange={e => setPayoutMethod(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="other">Autre</option>
              </select>
              <input
                type="text"
                value={payoutRef}
                onChange={e => setPayoutRef(e.target.value)}
                placeholder="Référence (optionnel)"
                className="px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={recordPayout}
                disabled={isPending || !payoutAmount}
                className="py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-xs font-semibold transition-colors"
              >
                Valider le paiement
              </button>
            </div>
          </div>

          {/* Utilisateurs référés */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E1E]">
              <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Utilisateurs référés ({referrals.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E]">
                  {['Utilisateur', 'Plan', 'Inscrit le'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="text-xs text-white">{r.profiles?.full_name ?? '—'}</p>
                      <p className="font-mono text-[10px] text-gray-500">{r.profiles?.email ?? r.referred_user_id.slice(0, 16)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${r.profiles?.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' : 'bg-[#222] text-gray-500'}`}>
                        {(r.profiles?.plan ?? 'free').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-gray-600">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-6 text-center text-xs text-gray-600">Aucun utilisateur référé.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Commissions */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E1E]">
              <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Commissions ({commissions.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E]">
                  {['Date', 'Revenu', 'Commission', 'Facture Stripe', 'Statut'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => {
                  const st = COMM_STATUS[c.status] ?? { label: c.status, color: 'text-gray-400' }
                  return (
                    <tr key={c.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-[10px] text-gray-500">{fmtDate(c.created_at)}</td>
                      <td className="px-5 py-3 text-xs">{fmt(Number(c.amount_revenue))}</td>
                      <td className="px-5 py-3 text-xs font-semibold">{fmt(Number(c.amount_commission))}</td>
                      <td className="px-5 py-3 font-mono text-[10px] text-gray-600">{c.stripe_invoice_id.slice(0, 20)}…</td>
                      <td className="px-5 py-3"><span className={`text-[10px] font-mono ${st.color}`}>{st.label}</span></td>
                    </tr>
                  )
                })}
                {commissions.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-xs text-gray-600">Aucune commission.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Historique paiements */}
          {payouts.length > 0 && (
            <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E1E1E]">
                <h2 className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">Paiements versés</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E1E]">
                    {['Date', 'Montant', 'Méthode', 'Référence', 'Statut'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-[10px] text-gray-500">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3 font-semibold text-sm">{fmt(Number(p.amount))}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{p.payment_method === 'paypal' ? 'PayPal' : 'Virement'}</td>
                      <td className="px-5 py-3 font-mono text-[10px] text-gray-600">{p.payment_reference ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`font-mono text-[10px] ${p.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {p.status === 'paid' ? 'Payé' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
