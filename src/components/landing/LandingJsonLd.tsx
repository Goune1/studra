import { FAQ_ITEMS } from './faq-data'

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

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://studra.fr/#website',
  url: 'https://studra.fr',
  name: 'Studra',
  description: "Révision intelligente avec l'IA",
}

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Studra',
  url: 'https://studra.fr',
  description:
    'Plateforme de révision IA pour étudiants : flashcards FSRS 5, fiches de révision, mode Socrate, examens blancs, planning de révision.',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      name: 'Studra Free',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Studra Pro',
      price: '4.99',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  ],
  featureList: [
    'Génération de flashcards depuis PDF',
    'Répétition espacée FSRS 5',
    'Fiches de révision automatiques',
    'Mode Socrate',
    'Examens blancs IA',
    'Planning de révision personnalisé',
    'Import YouTube avec transcription automatique',
    'Schémas conceptuels générés par IA',
  ],
  inLanguage: 'fr',
}

export function LandingJsonLd() {
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
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
