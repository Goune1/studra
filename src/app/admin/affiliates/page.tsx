import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Sidebar } from '@/components/admin/Sidebar'
import { Users, MousePointer, TrendingUp, Wallet } from 'lucide-react'

function getAdminDB() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function fmt(v: number) {
  return v.toFixed(2).replace('.', ',') + ' €'
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminAffiliatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const db = getAdminDB()

  const [affiliatesRes, clicksRes, referralsRes, commissionsRes] = await Promise.all([
    db.from('affiliates').select('id, user_id, referral_code, commission_rate, status, first_name, last_name, contact_email, payment_method, created_at').order('created_at', { ascending: false }),
    db.from('affiliate_clicks').select('affiliate_id'),
    db.from('affiliate_referrals').select('affiliate_id, referred_user_id, profiles!inner(plan)'),
    db.from('affiliate_commissions').select('affiliate_id, amount_revenue, amount_commission, status'),
  ])

  const affiliates = affiliatesRes.data ?? []
  const clicks = clicksRes.data ?? []
  const referrals = referralsRes.data ?? []
  const commissions = commissionsRes.data ?? []

  type ReferralRow = { affiliate_id: string; profiles: unknown }
  type CommRow = { affiliate_id: string; amount_revenue: number; amount_commission: number; status: string }

  function getPlan(profiles: unknown): string {
    if (!profiles) return 'free'
    const p = Array.isArray(profiles) ? profiles[0] : profiles
    return (p as { plan?: string })?.plan ?? 'free'
  }

  // Globaux
  const totalRevenue = (commissions as CommRow[]).reduce((s, c) => s + Number(c.amount_revenue), 0)
  const totalCommission = (commissions as CommRow[]).reduce((s, c) => s + Number(c.amount_commission), 0)
  const totalPayable = (commissions as CommRow[]).filter(c => c.status === 'payable').reduce((s, c) => s + Number(c.amount_commission), 0)
  const totalPaid = (commissions as CommRow[]).filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount_commission), 0)

  type Affiliate = { id: string; referral_code: string; commission_rate: number; status: string; first_name: string; last_name: string; contact_email: string; payment_method: string | null; created_at: string }

  const withStats = (affiliates as Affiliate[]).map((a) => {
    const aComm = (commissions as CommRow[]).filter(c => c.affiliate_id === a.id)
    const aRef = (referrals as ReferralRow[]).filter(r => r.affiliate_id === a.id)
    return {
      ...a,
      totalClicks: clicks.filter((c: { affiliate_id: string }) => c.affiliate_id === a.id).length,
      totalReferrals: aRef.length,
      activeSubscribers: aRef.filter(r => getPlan(r.profiles) === 'pro').length,
      totalCommission: aComm.reduce((s, c) => s + Number(c.amount_commission), 0),
      payable: aComm.filter(c => c.status === 'payable').reduce((s, c) => s + Number(c.amount_commission), 0),
    }
  })

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen transition-all duration-300">
        <div className="p-5 max-w-[1400px]">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-base font-semibold text-white">Affiliés</h1>
              <p className="font-mono text-xs text-gray-600 mt-0.5">{affiliates.length} affilié{affiliates.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* KPIs globaux */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Affiliés actifs',       value: String(withStats.filter(a => a.status === 'active').length),  icon: Users },
              { label: 'Revenus générés',       value: fmt(totalRevenue),          icon: TrendingUp },
              { label: 'Commissions générées',  value: fmt(totalCommission),       icon: MousePointer },
              { label: 'À payer',               value: fmt(totalPayable),          icon: Wallet },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-gray-500" />
                  <p className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-xl font-bold text-white tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E]">
                  {['Affilié', 'Code', 'Taux', 'Clics', 'Refs', 'Actifs', 'Commission', 'Payable', 'Statut', 'Créé le'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withStats.map((a, i) => (
                  <tr key={a.id} className={`border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliates/${a.id}`} className="hover:text-violet-400 transition-colors">
                        <p className="text-white text-xs font-medium">{a.first_name} {a.last_name}</p>
                        <p className="font-mono text-[10px] text-gray-600">{a.contact_email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-violet-400">{a.referral_code}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{a.commission_rate}%</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{a.totalClicks}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{a.totalReferrals}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-green-400">{a.activeSubscribers}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-300">{fmt(a.totalCommission)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-yellow-400">{a.payable > 0 ? fmt(a.payable) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {a.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-600">{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
                {withStats.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-600">Aucun affilié pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaid > 0 && (
            <p className="font-mono text-[10px] text-gray-600 mt-3">Total versé historique : {fmt(totalPaid)}</p>
          )}
        </div>
      </main>
    </div>
  )
}
