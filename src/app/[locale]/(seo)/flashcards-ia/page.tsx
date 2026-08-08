import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Créer des flashcards IA depuis un cours | Studra',
  description:
    'Génère automatiquement des flashcards depuis ton cours, PDF ou vidéo YouTube. Algorithme FSRS 5 pour une mémorisation optimale. Alternative IA à Anki et Quizlet.',
  alternates: {
    canonical: 'https://studra.fr/flashcards-ia',
  },
  openGraph: {
    title: 'Créer des flashcards avec l\'IA depuis un PDF ou un cours | Studra',
    description:
      'Génère automatiquement des flashcards depuis ton cours, PDF ou vidéo YouTube. Algorithme FSRS 5 pour une mémorisation optimale. Alternative IA à Anki et Quizlet.',
    url: 'https://studra.fr/flashcards-ia',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Créer des flashcards avec l\'IA depuis un PDF ou un cours | Studra',
    description:
      'Génère automatiquement des flashcards depuis ton cours, PDF ou vidéo YouTube. Algorithme FSRS 5 pour une mémorisation optimale.',
  },
}

const faqItems = [
  {
    q: 'Comment créer des flashcards depuis un PDF avec Studra ?',
    a: "Importe ton PDF dans Studra (jusqu'à 10 Mo, avec OCR intégré pour les scans), sélectionne le format « Flashcards » et clique sur Générer. En 10 à 30 secondes, tu obtiens entre 10 et 25 flashcards question/réponse couvrant les points clés de ton cours.",
  },
  {
    q: "Studra est-il une vraie alternative à Anki pour la répétition espacée ?",
    a: "Oui. Studra utilise l'algorithme FSRS 5, le successeur open-source de SM-2 utilisé par Anki. FSRS modélise la stabilité et la difficulté de chaque carte individuellement, avec une précision supérieure à SM-2. La différence principale : Studra génère les cartes automatiquement, Anki nécessite une création manuelle.",
  },
  {
    q: "Quelles sources peut-on importer dans Studra pour générer des flashcards ?",
    a: "Trois sources sont supportées : PDF (jusqu'à 10 Mo, OCR intégré pour les documents scannés), texte brut collé directement dans l'interface, et liens YouTube (Studra extrait automatiquement la transcription). Word et Pages arrivent prochainement.",
  },
  {
    q: "Combien de flashcards Studra génère-t-il ?",
    a: "Entre 10 et 25 cartes selon la longueur et la densité du cours. L'IA sélectionne les concepts les plus importants et formule des paires question/réponse ciblées. Tu peux modifier, ajouter ou supprimer des cartes après génération.",
  },
  {
    q: 'La génération de flashcards est-elle gratuite ?',
    a: "Oui. Le plan gratuit inclut 5 générations par mois, accessibles sans carte bancaire. Le plan Pro (4,99 €/mois) offre des générations illimitées.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://studra.fr' },
    { '@type': 'ListItem', position: 2, name: 'Flashcards IA', item: 'https://studra.fr/flashcards-ia' },
  ],
}

export default async function FlashcardsIaPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Hero */}
      <section className="py-24 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <nav className="text-sm text-fg-mute mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-fg transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-fg">Flashcards IA</span>
          </nav>
          <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Mémorisation active</span>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-6 max-w-[16ch]">
            Crée tes flashcards automatiquement avec l&apos;IA
          </h1>
          <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6] mb-10">
            Importe ton cours, ton PDF ou une vidéo YouTube. Studra génère entre 10 et 25 flashcards
            question/réponse en 10 secondes, révisables avec l&apos;algorithme de mémoire FSRS 5.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-primary">
              Générer mes flashcards gratuitement <span className="arrow">→</span>
            </Link>
            <Link href="/login" className="btn btn-outline">
              Me connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(30px,4vw,48px)] tracking-[-0.02em] mb-4">
            Comment ça marche
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-12">
            Trois étapes pour transformer n&apos;importe quel cours en flashcards prêtes à réviser.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                title: 'Importe ton cours',
                desc: "Colle ton PDF (jusqu'à 10 Mo, OCR intégré pour les scans), colle ton texte directement ou colle un lien YouTube. Studra extrait le contenu automatiquement.",
              },
              {
                n: '02',
                title: 'Génère les flashcards',
                desc: "L'IA analyse ton cours, identifie les concepts clés, les définitions et les points importants, puis formule des paires question/réponse précises. En 10 à 30 secondes.",
              },
              {
                n: '03',
                title: 'Révise avec FSRS 5',
                desc: 'Lance une session de révision. Pour chaque carte, évalue ta réponse sur 4 niveaux. FSRS calcule la prochaine date de révision optimale pour chaque carte individuellement.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[20px] p-7"
              >
                <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">{step.n}</span>
                <h3 className="font-serif text-[22px] tracking-[-0.015em] mt-2.5 mb-3">{step.title}</h3>
                <p className="text-fg-dim text-sm leading-[1.6]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FSRS 5 */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
              L&apos;algorithme FSRS 5 : la répétition espacée de nouvelle génération
            </h2>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              La mémorisation active repose sur un principe : réviser chaque information exactement au moment où tu
              vas l&apos;oublier. Trop tôt, la révision est inutile. Trop tard, tu as oublié et le réapprentissage
              prend du temps. L&apos;algorithme FSRS 5 calcule ce moment optimal pour chaque carte individuellement.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              Contrairement à SM-2 (l&apos;algorithme historique d&apos;Anki), FSRS modélise deux paramètres pour
              chaque carte mémoire : la <strong className="text-fg">stabilité</strong> (combien de temps tu vas te
              souvenir) et la <strong className="text-fg">difficulté intrinsèque</strong> (la facilité propre à la
              carte). Ces deux variables sont recalculées après chaque révision.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65]">
              Tu évalues ta réponse sur 4 niveaux : <strong className="text-fg">Encore</strong> (à revoir
              immédiatement), <strong className="text-fg">Difficile</strong>,{' '}
              <strong className="text-fg">Bien</strong>, <strong className="text-fg">Facile</strong>. Ce calibrage
              précis permet à FSRS de construire un modèle de ta mémoire carte par carte.
            </p>
          </div>
          <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-8">
            <h3 className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase mb-5">FSRS 5 en chiffres</h3>
            {[
              { label: 'Paramètres par carte', value: '2 (stabilité + difficulté)' },
              { label: 'Niveaux d\'évaluation', value: '4 (Encore / Difficile / Bien / Facile)' },
              { label: 'Précision vs SM-2', value: '+15 à +20 % sur données réelles' },
              { label: 'Rétention cible', value: '90 % configurable' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-start py-3.5 border-b border-line last:border-0 gap-4">
                <span className="text-fg-dim text-sm">{row.label}</span>
                <span className="text-fg text-sm font-medium text-right">{row.value}</span>
              </div>
            ))}
            <Link href="/repetition-espacee" className="block mt-6 text-sm text-accent hover:text-accent/80 transition-colors">
              En savoir plus sur la répétition espacée →
            </Link>
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Depuis n&apos;importe quelle source
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-12">
            Studra accepte trois types de sources pour générer tes flashcards. Pas besoin de préparer le contenu —
            l&apos;IA s&apos;adapte à chaque format.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '📄',
                title: 'PDF (jusqu\'à 10 Mo)',
                desc: 'Cours scannés, polycopiés, articles académiques. L\'OCR intégré extrait le texte des documents numérisés et des photos de tableau.',
              },
              {
                icon: '✏️',
                title: 'Texte brut',
                desc: 'Colle directement tes notes de cours, un résumé, des extraits de manuel ou tout autre texte. Studra traite le contenu en quelques secondes.',
              },
              {
                icon: '▶️',
                title: 'Lien YouTube',
                desc: 'Colle l\'URL d\'une vidéo de cours, d\'une conférence ou d\'un documentaire. Studra extrait automatiquement la transcription et génère les cartes.',
              },
            ].map((source) => (
              <div
                key={source.title}
                className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[20px] p-7"
              >
                <span className="text-3xl mb-4 block">{source.icon}</span>
                <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2.5">{source.title}</h3>
                <p className="text-fg-dim text-sm leading-[1.6]">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Studra vs Anki vs Quizlet
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-10">
            Trois outils différents pour trois usages différents. Voici les critères qui comptent vraiment
            pour un étudiant francophone en 2025.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 pr-6 text-fg-mute font-mono text-[11px] uppercase tracking-[0.12em]">Critère</th>
                  <th className="text-center py-3 px-4 text-accent font-semibold">Studra</th>
                  <th className="text-center py-3 px-4 text-fg-dim">Anki</th>
                  <th className="text-center py-3 px-4 text-fg-dim">Quizlet</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Génération automatique depuis PDF', '✓', '✗', '~ limité'],
                  ['Transcription YouTube', '✓', '✗', '✗'],
                  ['Algorithme de répétition espacée', 'FSRS 5', 'SM-2 / FSRS', 'Basique'],
                  ['IA intégrée pour la création', '✓', '✗', '~ basique'],
                  ['Multi-formats (fiches, examens…)', '✓', '✗', '✗'],
                  ['Gratuit (offre de base)', '✓', '✓', '~ limité'],
                  ['Application mobile', 'Web', '✓', '✓'],
                ].map(([crit, studra, anki, quizlet]) => (
                  <tr key={crit} className="border-b border-line/50 hover:bg-white/[0.02]">
                    <td className="py-3.5 pr-6 text-fg-dim">{crit}</td>
                    <td className="text-center py-3.5 px-4 text-fg font-medium">{studra}</td>
                    <td className="text-center py-3.5 px-4 text-fg-dim">{anki}</td>
                    <td className="text-center py-3.5 px-4 text-fg-dim">{quizlet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[820px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-10 text-center">
            Questions fréquentes
          </h2>
          <div className="border-t border-line">
            {faqItems.map((item, i) => (
              <details key={i} className="faq border-b border-line py-5 px-1 cursor-pointer">
                <summary className="flex justify-between items-center gap-4 cursor-pointer">
                  <span className="font-serif text-[20px] tracking-[-0.015em]">{item.q}</span>
                  <span className="faq-plus" />
                </summary>
                <p className="text-fg-dim text-[15px] leading-[1.6] pt-3.5 pb-1.5 max-w-[68ch]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-7 border-b border-line text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Prêt à mémoriser plus vite ?
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] mb-8">
            Rejoins les étudiants qui utilisent Studra pour transformer leurs cours en flashcards en quelques secondes.
            Gratuit, sans carte bancaire.
          </p>
          <Link href="/register" className="btn btn-primary">
            Créer mon compte gratuitement <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Découvre aussi */}
      <section className="py-16 px-7">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.15em] mb-6">Découvre aussi</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/repetition-espacee"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">La répétition espacée</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Comprends la science derrière FSRS 5 et la courbe de l&apos;oubli d&apos;Ebbinghaus.
              </p>
            </Link>
            <Link
              href="/fiches-de-revision-ia"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Fiches de révision IA</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Le même cours génère aussi des fiches structurées avec titres, définitions et points clés.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
