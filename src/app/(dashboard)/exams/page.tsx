import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageClient, { type ExamSessionScore, type ExamSummary } from './page-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: exams }, { data: sessions }] = await Promise.all([
    supabase
      .from('exams')
      .select('id, title, subject, questions, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exam_sessions')
      .select('exam_id, score')
      .eq('user_id', user.id),
  ])

  return (
    <PageClient
      initialExams={(exams ?? []) as ExamSummary[]}
      initialSessions={(sessions ?? []) as ExamSessionScore[]}
    />
  )
}
