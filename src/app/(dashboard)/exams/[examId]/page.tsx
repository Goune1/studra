import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Exam, ExamSession } from '@/types'
import PageClient from './page-client'

export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: exam }, { data: sessions }] = await Promise.all([
    supabase.from('exams').select('*').eq('id', examId).eq('user_id', user.id).single(),
    supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
  ])

  if (!exam) notFound()

  return <PageClient exam={exam as Exam} pastSessions={(sessions ?? []) as ExamSession[]} />
}
