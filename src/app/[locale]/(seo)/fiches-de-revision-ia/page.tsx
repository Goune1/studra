import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Générateur de fiches de révision IA | Studra',
  description:
    'Crée des fiches de révision structurées en quelques secondes depuis n\'importe quel cours. Titres, définitions, points clés générés par IA.',
  alternates: {
    canonical: 'https://studra.fr/fiches-de-revision-ia',
  },
  openGraph: {
    title: 'Générateur de fiches de révision IA | Studra',
    description:
      'Crée des fiches de révision structurées en quelques secondes depuis n\'importe quel cours. Titres, définitions, points clés générés par IA.',
    url: 'https://studra.fr/fiches-de-revision-ia',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Générateur de fiches de révision IA | Studra',
    description:
      'Crée des fiches de révision structurées en quelques secondes depuis n\'importe quel cours.',
  },
}

const faqItems = [
  {
    q: 'Combien de temps faut-il pour générer une fiche de révision avec Studra ?',
    a: "Entre 5 et 30 secondes selon la longueur du cours. Une fiche depuis un cours de 10 pages prend environ 15 secondes. La fiche générée est immédiatement lisible et modifiable.",
  },
  {
    q: "Les fiches générées par Studra sont-elles personnalisables ?",
    a: "Oui, chaque fiche est entièrement modifiable dans l'éditeur Markdown intégré. Tu peux ajouter des sections, reformuler des définitions, supprimer des parties ou enrichir le contenu. La fiche t'appartient.",
  },
  {
    q: 'Studra peut-il générer des fiches depuis des cours en langue étrangère ?',
    a: "Oui. Studra génère la fiche dans la langue du cours importé. Anglais, espagnol, allemand, italien et 5 autres langues sont supportés en plus du français.",
  },
  {
    q: "Quelle est la différence entre une fiche de révision et des flashcards dans Studra ?",
    a: "La fiche de révision donne une vue d'ensemble structurée du cours (synthèse, définitions, points clés) — idéale pour comprendre et mémoriser la structure. Les flashcards testent des éléments précis via la pratique de récupération active. Les deux formats se complètent et peuvent être générés depuis le même cours.",
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
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Fiches de révision IA',
      item: 'https://studra.fr/fiches-de-revision-ia',
    },
  ],
}

const matieres = [
  {
    name: 'Droit',
    desc: 'Définitions juridiques, articles de loi, jurisprudences clés, distinctions entre notions voisines. La fiche structure automatiquement le plan en parties/sous-parties.',
  },
  {
    name: 'Médecine',
    desc: "Mécanismes physiopathologiques, traitements, diagnostics différentiels, signes cliniques. L'IA organise les informations selon les conventions médicales.",
  },
  {
    name: 'Histoire',
    desc: "Chronologie des événements, acteurs clés, causes et conséquences, contexte géopolitique. La frise chronologique peut être générée en complément.",
  },
  {
    name: 'Économie',
    desc: "Concepts, modèles, auteurs de référence, chiffres clés. Les relations entre théories sont mises en évidence dans la structure de la fiche.",
  },
  {
    name: 'Langues',
    desc: 'Règles grammaticales, vocabulaire thématique, expressions idiomatiques, exercices de distinction. Supporte toutes les langues d\'enseignement.',
  },
  {
    name: 'Sciences',
    desc: 'Formules, lois, démonstrations-clés, définitions de concepts. Le format Markdown permet d\'intégrer les formules mathématiques en LaTeX.',
  },
]

export default async function FichesRevisionIaPage({params}: {params: Promise<{locale: string}>}) {
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
            <span className="text-fg">Fiches de révision IA</span>
          </nav>
          <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Synthèse intelligente</span>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-6 max-w-[18ch]">
            Génère des fiches de révision en quelques secondes grâce à l&apos;IA
          </h1>
          <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6] mb-10">
            Ton cours devient une fiche structurée avec titres hiérarchiques, définitions, points clés et résumé.
            En format Markdown, modifiable, imprimable. Pour toutes les matières.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-primary">
              Générer ma fiche gratuitement <span className="arrow">→</span>
            </Link>
            <Link href="/login" className="btn btn-outline">
              Me connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Format structuré */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
              Des fiches structurées, pas un résumé brouillon
            </h2>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              Studra ne génère pas un résumé en bloc de texte : il produit une fiche mémo structurée selon un plan
              hiérarchique, avec des sections, sous-sections, définitions en gras, listes à puces pour les points
              clés, et un résumé synthétique en tête de fiche.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              Le format Markdown garantit une lisibilité parfaite dans Studra : titres, sous-titres, définitions
              encadrées, tableaux comparatifs. Tu peux modifier la fiche dans l&apos;éditeur intégré ou l&apos;exporter
              en texte brut pour l&apos;imprimer ou la partager.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65]">
              Contrairement à un simple condensé de cours, la fiche générée par Studra identifie les notions
              les plus importantes et les hiérarchise. L&apos;IA détecte automatiquement si le contenu est un cours
              de droit (et structure selon plan juridique), de médecine (et suit les conventions cliniques),
              d&apos;histoire (et organise chronologiquement), etc.
            </p>
          </div>
          <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 font-mono text-[13px] leading-[1.7]">
            <div className="text-accent mb-3 text-[11px] uppercase tracking-[0.15em]">Exemple de fiche générée</div>
            <div className="text-fg font-semibold mb-1"># La Doctrine Truman (1947)</div>
            <div className="text-fg-dim mb-3">## Contexte géopolitique</div>
            <div className="text-fg-dim/80 text-[12px] mb-3">Guerre froide naissante, 1947. URSS étend son influence en Europe de l&apos;Est. Grèce et Turquie menacées.</div>
            <div className="text-fg-dim mb-2">## Points clés</div>
            <div className="text-fg-dim/80 text-[12px]">- <strong>Aide économique et militaire</strong> aux pays menacés par le communisme</div>
            <div className="text-fg-dim/80 text-[12px]">- <strong>Containment</strong> : endiguement de l&apos;expansion soviétique</div>
            <div className="text-fg-dim/80 text-[12px] mb-3">- Rupture avec l&apos;isolationnisme américain traditionnel</div>
            <div className="text-fg-dim mb-2">## Définition clé</div>
            <div className="text-fg-dim/80 text-[12px]"><strong>Containment</strong> : politique étrangère américaine visant à empêcher la propagation du communisme sans guerre directe avec l&apos;URSS.</div>
          </div>
        </div>
      </section>

      {/* Pour toutes les matières */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Pour toutes les matières
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-12">
            Studra s&apos;adapte au type de contenu détecté et structure la fiche selon les conventions de chaque
            discipline. Pas de modèle générique — une fiche intelligente adaptée à ta matière.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {matieres.map((m) => (
              <div
                key={m.name}
                className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6"
              >
                <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2.5">{m.name}</h3>
                <p className="text-fg-dim text-sm leading-[1.6]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* En 3 étapes */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-10">
            En 3 étapes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                title: 'Colle ton cours',
                desc: "Importe un PDF (jusqu'à 10 Mo, OCR intégré), colle ton texte ou colle un lien YouTube. Studra extrait et nettoie le contenu automatiquement.",
              },
              {
                n: '02',
                title: 'Génère la fiche',
                desc: "Sélectionne le format « Fiche de révision ». L'IA structure le cours en sections hiérarchiques, identifie les définitions clés et produit les points essentiels.",
              },
              {
                n: '03',
                title: 'Consulte et révise',
                desc: "Lis la fiche pour une vue d'ensemble. Utilise les flashcards générées depuis le même cours pour ancrer les détails par répétition espacée.",
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
            Transforme ton cours en fiche maintenant
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] mb-8">
            Gratuit, sans carte bancaire. En 30 secondes, ton cours devient une fiche de révision structurée
            et des flashcards prêtes à réviser.
          </p>
          <Link href="/register" className="btn btn-primary">
            Créer ma première fiche <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Découvre aussi */}
      <section className="py-16 px-7">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.15em] mb-6">Découvre aussi</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/flashcards-ia"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Flashcards IA</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Le même cours génère aussi des flashcards avec répétition espacée FSRS 5 pour mémoriser les détails.
              </p>
            </Link>
            <Link
              href="/examen-blanc-ia"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Examens blancs IA</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                7 QCM + 3 questions ouvertes générés depuis ton cours pour t&apos;entraîner dans les conditions réelles.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
