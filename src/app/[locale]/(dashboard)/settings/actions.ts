'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateMarketingConsent(marketingConsent: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Session expirée.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ marketing_consent: marketingConsent })
    .eq('id', user.id)

  if (error) {
    return { ok: false, error: 'Impossible de mettre à jour cette préférence.' }
  }

  revalidatePath('/settings')
  return { ok: true }
}
