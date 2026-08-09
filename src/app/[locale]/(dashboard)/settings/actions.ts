'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'

export async function updateMarketingConsent(marketingConsent: boolean) {
  const t = await getTranslations('dashboard.settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: t('sessionExpired') }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ marketing_consent: marketingConsent })
    .eq('id', user.id)

  if (error) {
    return { ok: false, error: t('preferenceUpdateError') }
  }

  revalidatePath('/settings')
  return { ok: true }
}
