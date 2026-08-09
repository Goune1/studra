import {
  getPathnameLocale,
  isAppLocale,
  resolveLocalePreference,
  type AppLocale,
} from '@/i18n/pathname'

type LocaleProfile = {
  preferred_locale?: string | null
}

type ServerLocaleOptions = {
  pathname?: string
  profile?: LocaleProfile | null
}

const contentLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja'] as const
const contentLanguageSet = new Set<string>(contentLanguages)
export type ContentLanguage = (typeof contentLanguages)[number]

export function resolveContentLanguage(language: unknown, locale: AppLocale): ContentLanguage {
  return typeof language === 'string' && contentLanguageSet.has(language)
    ? language as ContentLanguage
    : locale
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=')
    if (rawName === name) {
      try {
        return decodeURIComponent(rawValue.join('='))
      } catch {
        return null
      }
    }
  }

  return null
}

export function resolveServerLocale(
  request: Request,
  {pathname, profile}: ServerLocaleOptions = {},
): AppLocale {
  const profileLocale = profile?.preferred_locale

  if (isAppLocale(profileLocale)) return profileLocale

  return resolveLocalePreference({
    pathnameLocale: pathname ? getPathnameLocale(pathname) : null,
    cookieLocale: readCookie(request.headers.get('cookie'), 'NEXT_LOCALE'),
    acceptLanguage: request.headers.get('accept-language'),
  })
}
