export const locales = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
export const defaultLocale = 'fr' as const
export type AppLocale = (typeof locales)[number]

const localeSet = new Set<string>(locales)
const technicalPrefixes = ['/api', '/auth/callback', '/admin', '/_next', '/_vercel']
const publicFilePattern = /\.[^/]+$/

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
