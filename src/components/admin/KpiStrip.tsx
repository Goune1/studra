import { Users, Crown, TrendingUp, Zap } from 'lucide-react'
import type { AdminUser } from '@/lib/admin/mock-data'

interface Props {
  users: AdminUser[]
}

export function KpiStrip({ users }: Props) {
  const total     = users.length
  const proCount  = users.filter(u => u.plan === 'pro').length
  const proRate   = total > 0 ? Math.round((proCount / total) * 100) : 0
  const totalGens = users.reduce((s, u) => s + u.generationsUsed, 0)

  const STATS = [
    {
      label:  'Membres total',
      value:  total.toString(),
      delta:  `${proCount} Pro + ${total - proCount} Free`,
      icon:   Users,
      accent: 'text-blue-400',
      bg:     'bg-blue-500/10',
    },
    {
      label:  'Abonnés Pro',
      value:  proCount.toString(),
      delta:  `${proRate}% du total`,
      icon:   Crown,
      accent: 'text-green-400',
      bg:     'bg-green-500/10',
    },
    {
      label:  'Taux Pro',
      value:  `${proRate}%`,
      delta:  `${total - proCount} utilisateurs Free`,
      icon:   TrendingUp,
      accent: 'text-violet-400',
      bg:     'bg-violet-500/10',
    },
    {
      label:  'Générations ce mois',
      value:  totalGens.toLocaleString('fr-FR'),
      delta:  `moy. ${total > 0 ? Math.round(totalGens / total) : 0} / membre`,
      icon:   Zap,
      accent: 'text-amber-400',
      bg:     'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
      {STATS.map(({ label, value, delta, icon: Icon, accent, bg }) => (
        <div key={label} className="bg-[#161616] border border-[#222222] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{label}</span>
            <div className={`${bg} p-1.5 rounded-md`}>
              <Icon size={13} className={accent} />
            </div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-white tabular-nums">{value}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">{delta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
