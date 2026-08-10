import type {Metadata, MetadataRoute} from 'next'
import {
  defaultLocale,
  getLocalizedPathname,
  isAppLocale,
  type AppLocale,
} from '@/i18n/pathname'

export const SITE_URL = 'https://studra.fr'

// Enable another locale only after its public and editorial content is translated.
export const seoLocales = [defaultLocale] as const satisfies readonly AppLocale[]

const openGraphLocales: Record<AppLocale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_PT',
  de: 'de_DE',
  it: 'it_IT',
}

export type SitemapDescriptor = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'> & {
  pathname: string
}

export function getLocalizedUrl(pathname: string, locale: AppLocale): string {
  const localizedPathname = getLocalizedPathname(pathname, locale)
  return localizedPathname === '/' ? SITE_URL : `${SITE_URL}${localizedPathname}`
}

export function getLanguageAlternates(pathname: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      seoLocales.map((locale) => [locale, getLocalizedUrl(pathname, locale)]),
    ),
    'x-default': getLocalizedUrl(pathname, defaultLocale),
  }
}

export function localizedMetadata(
  metadata: Metadata,
  pathname: string,
  locale: string,
): Metadata {
  const resolvedLocale = isAppLocale(locale) ? locale : defaultLocale
  const isIndexable = seoLocales.some((seoLocale) => seoLocale === resolvedLocale)
  const canonicalLocale = isIndexable ? resolvedLocale : defaultLocale
  const canonical = getLocalizedUrl(pathname, canonicalLocale)

  return {
    ...metadata,
    alternates: {
      canonical,
      ...(isIndexable ? {languages: getLanguageAlternates(pathname)} : {}),
    },
    robots: isIndexable ? metadata.robots : {index: false, follow: true},
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          url: canonical,
          locale: openGraphLocales[canonicalLocale],
        }
      : metadata.openGraph,
  }
}

export function buildLocalizedSitemapEntries(
  descriptors: SitemapDescriptor[],
): MetadataRoute.Sitemap {
  return descriptors.flatMap(({pathname, ...descriptor}) =>
    seoLocales.map((locale) => ({
      ...descriptor,
      url: getLocalizedUrl(pathname, locale),
      alternates: {
        languages: getLanguageAlternates(pathname),
      },
    })),
  )
}
