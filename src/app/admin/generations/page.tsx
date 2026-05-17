import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/Sidebar'
import { fetchAdminUsers } from '@/lib/admin/queries'
import type { AdminUser, GenType } from '@/lib/admin/mock-data'

const TYPE_LABEL: Record<GenType, { label: string; color: string }> = {
  flashcards: { label: 'Flashcards',   color: '#F59E0B' },
  fiche:      { label: 'Fiche',        color: '#3B82F6' },
  schema:     { label: 'Schéma',       color: '#10B981' },
  frise:      { label: 'Frise',        color: '#8B5CF6' },
  examen:     { label: 'Examen',       color: '#EF4444' },
  annale:     { label: 'Annale',       color: '#F97316' },
  feynman:    { label: 'Socrate',       color: '#34D399' },
  rappel:     { label: 'Rappel libre', color: '#A78BFA' },
  planning:   { label: 'Planning',     color: '#6366f1' },
  socrate:    { label: 'Socrate',      color: '#F59E0B' },
}

const TOTAL_TYPES = Object.keys(TYPE_LABEL).length

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function GenerationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const users = await fetchAdminUsers()

  const totalGenerations = users.reduce((acc, u) => acc + u.generationsUsed, 0)
  const avgPerUser = users.length ? (totalGenerations / users.length).toFixed(1) : '0'

  // Count by type across all users
  const countByType = users.reduce<Record<GenType, number>>((acc, u) => {
    u.recentGenerations.forEach(g => {
      acc[g.type] = (acc[g.type] ?? 0) + 1
    })
    return acc
  }, {} as Record<GenType, number>)

  // Flatten all recent gens with user info, sorted by date desc
  const allGens = users
    .flatMap(u => u.recentGenerations.map(g => ({ ...g, userName: u.name, userEmail: u.email })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen transition-all duration-300">
        <div className="p-5 max-w-[1400px]">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-base font-semibold text-white">Générations IA</h1>
              <p className="font-mono text-xs text-gray-600 mt-0.5">{totalGenerations} génération{totalGenerations > 1 ? 's' : ''} ce mois</p>
            </div>
            <span className="font-mono text-[10px] text-gray-600 border border-[#222] rounded px-2 py-1">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total ce mois',  value: String(totalGenerations) },
              { label: 'Moy. / membre',  value: avgPerUser               },
              { label: 'Membres actifs', value: String(users.filter(u => u.generationsUsed > 0).length) },
              { label: 'Types utilisés', value: String(Object.keys(countByType).length) + ` / ${TOTAL_TYPES}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
                <p className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid xl:grid-cols-[1fr_320px] gap-4">

            {/* Par utilisateur */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1E1E1E]">
                <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Utilisation par membre</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E1E]">
                    {['Membre', 'Plan', 'Générations', 'Quota'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.generationsUsed - a.generationsUsed).map((u: AdminUser) => {
                    const pct = u.generationsQuota === null ? 0 : Math.min(u.generationsUsed / u.generationsQuota, 1)
                    const barColor = pct >= 0.8 ? '#EF4444' : pct >= 0.6 ? '#F59E0B' : '#22C55E'
                    return (
                      <tr key={u.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors">
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
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white">{u.generationsUsed}</span>
                            {u.generationsQuota !== null && (
                              <div className="w-20 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: barColor }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-500">
                          {u.generationsQuota === null ? '∞' : `/ ${u.generationsQuota}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Répartition par type */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-4">Par format</p>
              <div className="space-y-3">
                {(Object.entries(TYPE_LABEL) as [GenType, { label: string; color: string }][]).map(([type, { label, color }]) => {
                  const count = countByType[type] ?? 0
                  const total = Object.values(countByType).reduce((a, b) => a + b, 0) || 1
                  const pct = Math.round(count / total * 100)
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-[10px] text-gray-400">{label}</span>
                        <span className="font-mono text-[10px] text-gray-600">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {allGens.length > 0 && (
                <>
                  <div className="h-px bg-[#1E1E1E] my-5" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-3">Récentes</p>
                  <div className="space-y-2">
                    {allGens.slice(0, 10).map((g, i) => {
                      const t = TYPE_LABEL[g.type]
                      return (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                            <span className="font-mono text-[10px] text-gray-400 truncate">{g.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-[10px]" style={{ color: t.color }}>{t.label}</span>
                            <span className="font-mono text-[10px] text-gray-700">{fmt(g.date)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
