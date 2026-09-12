import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { StudyPlan, StudyPlanTask } from '@/types'
import PageClient, { type PlanSummary } from './page-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: plans }, { data: tasks }] = await Promise.all([
    supabase.from('study_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('study_plan_tasks').select('plan_id, status').eq('user_id', user.id),
  ])

  const planTasks = (tasks ?? []) as Pick<StudyPlanTask, 'plan_id' | 'status'>[]
  const summaries = ((plans ?? []) as StudyPlan[]).map((plan) => {
    const matchingTasks = planTasks.filter((task) => task.plan_id === plan.id)
    return {
      ...plan,
      totalTasks: matchingTasks.length,
      completedTasks: matchingTasks.filter((task) => task.status === 'completed').length,
    }
  })

  return <PageClient initialPlans={summaries as PlanSummary[]} />
}

export const metadata: Metadata = { title: 'Mes plannings' }
