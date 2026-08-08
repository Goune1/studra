import {defineRouting} from 'next-intl/routing'
import {defaultLocale, locales} from './pathname'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
})

export type AppLocale = (typeof routing.locales)[number]
