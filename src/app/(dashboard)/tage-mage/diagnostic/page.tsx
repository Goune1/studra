import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPublicTageMageDiagnosticQuestions } from '@/lib/tage-mage/question-bank.server'
import { DiagnosticClient } from './diagnostic-client'

export default async function TageMageDiagnosticPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goal } = await supabase
    .from('tage_mage_goals')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!goal) redirect('/tage-mage')

  const questions = getPublicTageMageDiagnosticQuestions()
  return <DiagnosticClient questions={questions} />
}
