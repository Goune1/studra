'use server'

import {cookies} from 'next/headers'
import {isAppLocale, type AppLocale} from '@/i18n/pathname'
import {createClient} from '@/lib/supabase/server'

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function setLocalePreference(locale: AppLocale) {
  if (!isAppLocale(locale)) {
    return {ok: false}
  }

  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  try {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) {
      return {ok: true}
    }

    const {error} = await supabase
      .from('profiles')
      .update({preferred_locale: locale})
      .eq('id', user.id)

    return {ok: !error}
  } catch {
    return {ok: false}
  }
}
