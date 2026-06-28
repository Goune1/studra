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
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  },
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

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment créer des flashcards depuis un PDF avec Studra ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Importe ton PDF ou colle ton cours dans Studra. L'IA génère automatiquement entre 10 et 25 flashcards question/réponse, révisables selon l'algorithme FSRS 5.",
      },
    },
    {
      '@type': 'Question',
      name: 'Studra est-il gratuit ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, Studra propose un accès gratuit aux fonctionnalités essentielles avec 5 générations par mois. Un plan Pro est disponible à 4,99 €/mois pour un accès illimité.',
      },
    },
    {
      '@type': 'Question',
      name: "Quelle est la différence entre Studra et Anki ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Studra génère automatiquement les flashcards depuis tes cours grâce à l'IA, là où Anki requiert de les créer manuellement. Les deux utilisent la répétition espacée, Studra avec l'algorithme FSRS 5.",
      },
    },
    {
      '@type': 'Question',
      name: 'Studra fonctionne-t-il pour toutes les matières ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Studra fonctionne pour toutes les matières textuelles : droit, médecine, histoire, économie, langues, etc.',
      },
    },
    {
      '@type': 'Question',
      name: 'Studra remplace-t-il mes cours ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Non. Studra est un outil de révision : il prend ton cours existant et le transforme en supports d'apprentissage actif. Le contenu vient toujours de toi.",
      },
    },
    {
      '@type': 'Question',
      name: "Puis-je annuler mon abonnement Pro ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, à tout moment depuis le portail client Stripe. Tu gardes l'accès Pro jusqu'à la fin de la période en cours, sans frais cachés.",
      },
    },
  ],
}

export function LandingJsonLd() {
  return (
    <>
      <JsonLdScript data={organizationSchema} />
      <JsonLdScript data={websiteSchema} />
      <JsonLdScript data={softwareApplicationSchema} />
      <JsonLdScript data={faqSchema} />
    </>
  )
}
