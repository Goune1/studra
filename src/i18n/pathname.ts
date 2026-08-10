export const locales = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
export const defaultLocale = 'fr' as const
export type AppLocale = (typeof locales)[number]

const localeSet = new Set<string>(locales)
const technicalPrefixes = ['/api', '/auth/callback', '/admin', '/_next', '/_vercel']
const publicFilePattern = /\.[^/]+$/

export type LocalePreferenceInput = {
  pathnameLocale?: string | null
  profileLocale?: string | null
  cookieLocale?: string | null
  acceptLanguage?: string | null
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return typeof value === 'string' && localeSet.has(value)
}

export function parseAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) return null

  const candidates = header
    .split(',')
    .map((entry, index) => {
      const [rawTag, ...parameters] = entry.trim().split(';')
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1

      return {
        locale: rawTag.toLowerCase().split('-')[0],
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      }
    })
    .filter(({locale, quality}) => isAppLocale(locale) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  return (candidates[0]?.locale as AppLocale | undefined) ?? null
}

export function resolveLocalePreference({
  pathnameLocale,
  profileLocale,
  cookieLocale,
  acceptLanguage,
}: LocalePreferenceInput): AppLocale {
  if (isAppLocale(pathnameLocale)) return pathnameLocale
  if (isAppLocale(profileLocale)) return profileLocale
  if (isAppLocale(cookieLocale)) return cookieLocale
  return parseAcceptLanguage(acceptLanguage) ?? defaultLocale
}

export function getPathnameLocale(pathname: string): AppLocale | null {
  const [, firstSegment] = pathname.split('/')
  return localeSet.has(firstSegment) ? firstSegment as AppLocale : null
}

export function getPathnameWithoutLocale(pathname: string): {
  locale: AppLocale
  pathname: string
} {
  const [, firstSegment, ...remainingSegments] = pathname.split('/')

  if (localeSet.has(firstSegment)) {
    return {
      locale: firstSegment as AppLocale,
      pathname: `/${remainingSegments.join('/')}` || '/',
    }
  }

  return {locale: defaultLocale, pathname}
}

export function getLocalizedPathname(pathname: string, locale: AppLocale): string {
  if (locale === defaultLocale) {
    return pathname
  }

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
}

export function shouldHandleI18n(pathname: string): boolean {
  if (publicFilePattern.test(pathname)) {
    return false
  }

  return !technicalPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
