import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { StudyPlan, StudyPlanTask } from '@/types'
import PageClient from './page-client'

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: plan }, { data: sessions }] = await Promise.all([
    supabase.from('study_plans').select('*').eq('id', planId).eq('user_id', user.id).single(),
    supabase
      .from('study_plan_tasks')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('scheduled_date')
      .order('session_position')
      .order('created_at'),
  ])

  if (!plan) notFound()

  return <PageClient initialPlan={plan as StudyPlan} initialSessions={(sessions ?? []) as StudyPlanTask[]} />
}
