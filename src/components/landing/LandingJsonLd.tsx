import { FAQ_ITEMS } from './faq-data'
import {getLocale, getTranslations} from 'next-intl/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonLdScript({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://studra.fr/#organization',
  name: 'Studra',
  url: 'https://studra.fr',
  logo: 'https://studra.fr/studra-logo.png',
}

export async function LandingJsonLd() {
  const [t, locale] = await Promise.all([getTranslations('landing'), getLocale()])
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://studra.fr/#website',
    url: 'https://studra.fr',
    name: 'Studra',
    description: t('jsonLd.websiteDescription'),
  }
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Studra',
    url: 'https://studra.fr',
    description: t('jsonLd.softwareDescription'),
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    offers: [
      {'@type': 'Offer', name: t('jsonLd.freeOffer'), price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock'},
      {'@type': 'Offer', name: t('jsonLd.proOffer'), price: '4.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock'},
    ],
    featureList: (['flashcards', 'spacing', 'fiches', 'socrate', 'exams', 'planning', 'youtube', 'schemas'] as const)
      .map((key) => t(`jsonLd.features.${key}`)),
    inLanguage: locale,
  }
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({questionKey, answerKey}) => ({
      '@type': 'Question',
      name: t(`faq.${questionKey}`),
      acceptedAnswer: {'@type': 'Answer', text: t(`faq.${answerKey}`)},
    })),
  }

  return (
    <>
      <JsonLdScript data={organizationSchema} />
      <JsonLdScript data={websiteSchema} />
      <JsonLdScript data={softwareApplicationSchema} />
      <JsonLdScript data={faqPage} />
    </>
  )
}
