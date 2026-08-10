'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { cancelSubscriptionImmediately } from '@/lib/stripe'
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

/**
 * Deletes the current user's account and all data owned by it (decks,
 * flashcards, fiches, exams, plans, Pronote credentials, etc. all cascade
 * via `on delete cascade` foreign keys to `profiles`/`auth.users`).
 *
 * Requires the caller to re-type their account email as a lightweight
 * confirmation (mirrors the pattern used for other destructive actions in
 * this app, see `DeleteEntityButton`).
 *
 * Some rows (Stripe affiliate commissions/payouts tied to this user) are
 * kept for as long as French accounting law requires and are protected by
 * `on delete restrict` foreign keys. When that happens we fall back to
 * anonymizing the profile and permanently locking the auth account instead
 * of a hard delete, so the account is unusable and stripped of personal
 * data while the mandatory financial trail stays intact.
 */
export async function deleteAccount(confirmationEmail: string) {
  const t = await getTranslations('dashboard.settings.deleteAccount')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: t('sessionExpired') }
  }

  if (confirmationEmail.trim().toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return { ok: false, error: t('emailMismatch') }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (profile?.stripe_subscription_id) {
    try {
      await cancelSubscriptionImmediately(profile.stripe_subscription_id)
    } catch {
      // Best-effort: don't block account deletion on a Stripe hiccup, the
      // webhook / manual ops can reconcile billing afterwards.
    }
  }

  const admin = getSupabaseAdmin()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    // Most likely cause: this account has affiliate commission/payout
    // records that must be retained (on delete restrict). Anonymize
    // instead of hard-deleting so the account can no longer be used or
    // identified.
    const anonymizedEmail = `deleted-${user.id}@studra.invalid`

    const { error: anonymizeError } = await admin
      .from('profiles')
      .update({
        email: anonymizedEmail,
        full_name: null,
        marketing_consent: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      })
      .eq('id', user.id)

    if (anonymizeError) {
      return { ok: false, error: t('genericError') }
    }

    const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
      email: anonymizedEmail,
      password: crypto.randomUUID(),
      ban_duration: '876000h',
      user_metadata: {},
    })

    if (banError) {
      return { ok: false, error: t('genericError') }
    }
  }

  await supabase.auth.signOut()

  return { ok: true }
}
