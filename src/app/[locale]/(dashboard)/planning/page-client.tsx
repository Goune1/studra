'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { CalendarDays, PlusCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { EmptyState } from '@/components/content/EmptyState'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { StudyPlan } from '@/types'

const COLOR = '#1F4D3F'

export default function PlanningListPage() {
  const t = useTranslations('dashboard.planning')
  const format = useFormatter()
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <Eyebrow className="mb-2">{t('label')}</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="section-h">{t('listTitle')}</h1>
            <span
              className="mono text-xs px-2 py-1 rounded-full font-medium tabular-nums"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}
            >
              {loading ? '…' : t('count', {count: plans.length})}
            </span>
          </div>
        </div>
        <Link href="/planning/new" className="btn btn-primary shrink-0">
          <PlusCircle size={15} />
          {t('new')}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          Icon={CalendarDays}
          color={COLOR}
          title={t('noneTitle')}
          subtitle={t('noneSubtitle')}
          ctaLabel={t('createFirst')}
          ctaHref="/planning/new"
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const daysLeft = Math.max(
              0,
              Math.round((new Date(plan.exam_date + 'T00:00:00').getTime() - nowMs) / 86_400_000),
            )
            return (
              <div key={plan.id} className="relative group/card animate-fade-up">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
                  <DeleteEntityButton
                    table="study_plans"
                    id={plan.id}
                    entityLabel="ce planning"
                    variant="icon"
                    color={COLOR}
                    onDeleted={(id) => setPlans((prev) => prev.filter((p) => p.id !== id))}
                  />
                </div>
                <Link
                  href={`/planning/${plan.id}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-[transform,padding] duration-200 hover:-translate-y-0.5 group-hover/card:pr-12"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: COLOR + '15' }}
                  >
                    <CalendarDays size={18} style={{ color: COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                      {plan.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {t('examOn', {date: format.dateTime(new Date(plan.exam_date + 'T00:00:00'), {dateStyle: 'short'})})}
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
