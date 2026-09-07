import { FAQ_ITEMS } from './faq-data'

const FAQ_CONTENT = {
  "items.difference.question": "C'est différent d'Anki ou de Quizlet ?", "items.difference.answer": "Anki ne génère rien — tu écris tes cartes à la main. Quizlet fait des QCM basiques. Studra prend ton cours et génère flashcards, fiches, schémas, examens et dialogues socratiques, le tout connecté au même algorithme de répétition espacée.",
  "items.accuracy.question": "L'IA peut se tromper sur les flashcards générées ?", "items.accuracy.answer": "Oui, ça arrive. Chaque carte est éditable en un clic. On affiche un score de confiance quand la génération hésite, et tu peux corriger ou supprimer en deux secondes.",
  "items.privacy.question": "Mes cours sont confidentiels ?", "items.privacy.answer": "Tes cours te restent. On ne les utilise pas pour entraîner de modèle. Les fichiers sont chiffrés, hébergés en Europe, et tu peux tout supprimer depuis ton compte.",
  "items.subjects.question": "Ça marche pour quelles matières ?", "items.subjects.answer": "Toutes les matières textuelles fonctionnent très bien — histoire, philo, SVT, langues, droit, médecine. Pour les maths et la physique, les flashcards et les fiches sont solides ; les schémas conceptuels marchent moins bien sur des démonstrations longues.",
  "items.results.question": "Combien de temps avant de voir un effet ?", "items.results.answer": "Dès la première semaine, tu remarques ce que tu retiens vraiment et ce que tu pensais retenir. L'effet sur la mémoire long terme est mesurable après deux à trois semaines de sessions régulières.",
  "items.cancel.question": "Je peux annuler Pro à tout moment ?", "items.cancel.answer": "Oui, en un clic depuis les paramètres. Pas de période d'engagement. Tu gardes Pro jusqu'à la fin du mois en cours, puis tu repasses sur Free sans rien perdre.",
  "items.trial.question": "Vous avez un essai gratuit ?", "items.trial.answer": "Le plan Free n'est pas une démo limitée dans le temps : il reste gratuit. Pour tester Pro, on rembourse les 14 premiers jours si ça ne te convient pas.",
  "items.teacher.question": "Studra remplace mon prof ?", "items.teacher.answer": "Non.",
} as const
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

export function LandingJsonLd() {
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
    description: "Plateforme de révision IA pour étudiants : flashcards FSRS 5, fiches de révision, mode Socrate, examens blancs, planning de révision.",
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    offers: [
      {'@type': 'Offer', name: 'Studra Free', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock'},
      {'@type': 'Offer', name: 'Studra Pro', price: '4.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock'},
    ],
    featureList: ["Génération de flashcards depuis PDF", "Répétition espacée FSRS 5", "Fiches de révision automatiques", "Mode Socrate", "Examens blancs IA", "Planning de révision personnalisé", "Import YouTube avec transcription automatique", "Schémas conceptuels générés par IA"],
    inLanguage: 'fr',
  }
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({questionKey, answerKey}) => ({
      '@type': 'Question',
      name: FAQ_CONTENT[questionKey],
      acceptedAnswer: {'@type': 'Answer', text: FAQ_CONTENT[answerKey]},
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
