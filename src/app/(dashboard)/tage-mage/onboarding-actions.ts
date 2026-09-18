'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type GoalActionState = { ok: boolean; error?: string }

function parseInteger(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  return Number(value)
}

export async function saveTageMageGoal(_previousState: GoalActionState, formData: FormData): Promise<GoalActionState> {
  const targetScore = parseInteger(formData.get('targetScore'))
  const weeklyMinutes = parseInteger(formData.get('weeklyMinutes'))
  const examDate = formData.get('examDate')

  if (targetScore === null || targetScore > 600) return { ok: false, error: 'Choisis un score cible entre 0 et 600.' }
  if (!weeklyMinutes || weeklyMinutes < 15 || weeklyMinutes > 1200) return { ok: false, error: 'Indique entre 15 et 1 200 minutes par semaine.' }
  if (typeof examDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return { ok: false, error: 'Choisis une date de passage valide.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Ta session a expiré. Connecte-toi à nouveau.' }

  const { error } = await supabase.from('tage_mage_goals').upsert({
    user_id: user.id,
    target_score: targetScore,
    weekly_minutes: weeklyMinutes,
    exam_date: examDate,
    updated_at: new Date().toISOString(),
  })

  if (error) return { ok: false, error: 'Impossible d’enregistrer ton objectif. Réessaie.' }

  revalidatePath('/tage-mage')
  return { ok: true }
}
