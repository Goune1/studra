import {defineRouting} from 'next-intl/routing'
import {defaultLocale, locales} from './pathname'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
})

export type AppLocale = (typeof routing.locales)[number]
