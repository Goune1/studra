import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/Sidebar'
import { fetchAdminUsers } from '@/lib/admin/queries'
import type { AdminUser } from '@/lib/admin/mock-data'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Actif',    color: '#22C55E', bg: '#22C55E15' },
  trialing: { label: 'Essai',    color: '#F59E0B', bg: '#F59E0B15' },
  canceled: { label: 'Annulé',   color: '#EF4444', bg: '#EF444415' },
  past_due: { label: 'Impayé',   color: '#F97316', bg: '#F9731615' },
  none:     { label: 'Aucun',    color: '#475569', bg: '#47556915' },
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PaiementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const users = await fetchAdminUsers()

  const proUsers    = users.filter(u => u.plan === 'pro')
  const activeCount = users.filter(u => u.stripeStatus === 'active').length
  const mrr         = activeCount * 4.99

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen transition-all duration-300">
        <div className="p-5 max-w-[1400px]">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-base font-semibold text-white">Paiements</h1>
              <p className="font-mono text-xs text-gray-600 mt-0.5">{proUsers.length} abonnement{proUsers.length > 1 ? 's' : ''} Pro</p>
            </div>
            <span className="font-mono text-[10px] text-gray-600 border border-[#222] rounded px-2 py-1">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Abonnés actifs',  value: String(activeCount),         sub: 'stripe active'        },
              { label: 'MRR estimé',      value: `${mrr.toFixed(2)} €`,       sub: 'à 4,99€ / mois'       },
              { label: 'Total Pro',       value: String(proUsers.length),      sub: `${users.length} membres`},
              { label: 'Taux conversion', value: `${Math.round(proUsers.length / Math.max(users.length, 1) * 100)}%`, sub: 'free → pro' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
                <p className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="font-mono text-[10px] text-gray-600 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E]">
                  {['Utilisateur', 'Plan', 'Stripe', 'Customer ID', 'Subscription ID', 'Inscrit le'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: AdminUser, i: number) => {
                  const st = STATUS_LABEL[u.stripeStatus] ?? STATUS_LABEL.none
                  return (
                    <tr key={u.id} className={`border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{u.name}</p>
                        <p className="font-mono text-[10px] text-gray-600">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${u.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' : 'bg-[#222] text-gray-500'}`}>
                          {u.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-500">
                        {u.stripeCustomerId ? u.stripeCustomerId.slice(0, 14) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-500">
                        {u.stripeStatus === 'active' ? '✓ actif' : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-600">{fmt(u.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
