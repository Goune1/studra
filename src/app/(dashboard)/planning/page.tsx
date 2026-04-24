'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CalendarDays, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { StudyPlan } from '@/types'

const COLOR = '#6366f1'

export default function PlanningListPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [nowMs] = useState(() => Date.now())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('study_plans')
        .select('*')
        .order('created_at', { ascending: false })
      setPlans((data ?? []) as StudyPlan[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Planning</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
            Plannings de révision générés par l&apos;IA
          </p>
        </div>
        <Link
          href="/planning/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: COLOR, color: '#fff' }}
        >
          <Plus size={15} /> Nouveau planning
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <CalendarDays size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>
            Aucun planning créé
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
            Génère un planning personnalisé jour par jour pour ton prochain examen.
          </p>
          <Link
            href="/planning/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: COLOR + '20', color: COLOR }}
          >
            <Plus size={14} /> Créer mon premier planning
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const daysLeft = Math.max(
              0,
              Math.round((new Date(plan.exam_date + 'T00:00:00').getTime() - nowMs) / 86_400_000),
            )
            return (
              <Link
                key={plan.id}
                href={`/planning/${plan.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:-translate-y-0.5 block"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: COLOR + '15' }}
                >
                  <CalendarDays size={18} style={{ color: COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                    {plan.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    Examen le {new Date(plan.exam_date + 'T00:00:00').toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {daysLeft > 0 ? (
                  <span
                    className="text-xs px-2 py-1 rounded-lg font-semibold shrink-0"
                    style={{
                      background: daysLeft <= 3 ? '#EF444415' : COLOR + '15',
                      color: daysLeft <= 3 ? '#EF4444' : COLOR,
                    }}
                  >
                    J-{daysLeft}
                  </span>
                ) : (
                  <CheckCircle2 size={16} className="shrink-0" style={{ color: '#10B981' }} />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
