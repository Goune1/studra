import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Génère un examen blanc depuis ton cours en un clic | Studra',
  description:
    '7 QCM et 3 questions ouvertes générés par IA depuis ton cours, corrigés avec feedback détaillé. Entraîne-toi dans les conditions réelles de l\'épreuve.',
  alternates: {
    canonical: 'https://studra.fr/examen-blanc-ia',
  },
  openGraph: {
    title: 'Génère un examen blanc depuis ton cours en un clic | Studra',
    description:
      '7 QCM et 3 questions ouvertes générés par IA depuis ton cours, corrigés avec feedback détaillé. Entraîne-toi dans les conditions réelles.',
    url: 'https://studra.fr/examen-blanc-ia',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Génère un examen blanc depuis ton cours en un clic | Studra',
    description:
      '7 QCM et 3 questions ouvertes générés par IA depuis ton cours, corrigés avec feedback détaillé.',
  },
}

const faqItems = [
  {
    q: "Comment Studra génère-t-il un examen blanc depuis mon cours ?",
    a: "Importe ton PDF, colle ton texte ou colle un lien YouTube, puis sélectionne le format « Examen blanc ». L'IA génère 7 QCM avec distracteurs construits et 3 questions ouvertes ciblant les notions clés du cours, en 30 à 60 secondes.",
  },
  {
    q: "Comment sont corrigées les questions ouvertes ?",
    a: "Les questions ouvertes sont corrigées automatiquement par l'IA : elle compare ta réponse avec les éléments attendus du cours, donne un score et un feedback détaillé expliquant ce qui manquait ou était inexact. Le meilleur score est mémorisé pour suivre ta progression.",
  },
  {
    q: "Qu'est-ce que la fonctionnalité Annales ?",
    a: "La fonctionnalité Annales te permet d'importer un vrai sujet d'examen passé comme modèle. Studra analyse le style des questions, le niveau de difficulté et la structure, puis génère de nouveaux examens d'entraînement dans le même format. Idéal pour préparer des concours avec des sujets-types.",
  },
  {
    q: "Les QCM générés sont-ils difficiles ?",
    a: "Les QCM incluent des distracteurs (mauvaises réponses) construits par l'IA pour tester la compréhension réelle, pas seulement la reconnaissance. Les distracteurs sont plausibles et ciblent les confusions classiques liées au contenu du cours.",
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
      name: 'Examen blanc IA',
      item: 'https://studra.fr/examen-blanc-ia',
    },
  ],
}

export default async function ExamenBlancIaPage({params}: {params: Promise<{locale: string}>}) {
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
            <span className="text-fg">Examen blanc IA</span>
          </nav>
          <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Pratique de récupération</span>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-6 max-w-[16ch]">
            Génère un examen blanc depuis ton cours en un clic
          </h1>
          <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6] mb-10">
            7 QCM avec distracteurs + 3 questions ouvertes corrigées par IA. Feedback détaillé. Score mémorisé.
            Entraîne-toi dans les conditions réelles de l&apos;épreuve.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-primary">
              Générer mon examen blanc <span className="arrow">→</span>
            </Link>
            <Link href="/login" className="btn btn-outline">
              Me connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Un vrai examen */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
              Un vrai examen, pas un quiz basique
            </h2>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              Les outils de quiz en ligne génèrent souvent des questions trop faciles avec des réponses
              évidentes. Studra construit de vrais examens blancs avec des{' '}
              <strong className="text-fg">distracteurs plausibles</strong> — des mauvaises réponses conçues
              pour tester la compréhension réelle, pas la simple reconnaissance.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              Chaque examen comprend :
            </p>
            <ul className="space-y-3 mb-6">
              {[
                '7 QCM à 4 choix avec distracteurs construits à partir des confusions classiques du cours',
                '3 questions ouvertes ciblant les notions complexes qui nécessitent une réponse développée',
                'Correction automatique par IA avec feedback détaillé sur les erreurs',
                'Score final et meilleur score mémorisé pour suivre ta progression',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-fg-dim text-[15px]">
                  <span className="tick mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-fg-dim text-[16px] leading-[1.65]">
              Les questions ouvertes sont corrigées par l&apos;IA qui compare ta réponse aux éléments attendus,
              identifie ce qui manque et explique pourquoi — pas seulement un score brut.
            </p>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6">
              <span className="font-mono text-[11px] text-accent uppercase tracking-[0.12em]">QCM avec distracteurs</span>
              <p className="text-fg text-[15px] font-medium mt-3 mb-4">
                Quelle est la principale différence entre la doctrine Truman et le Plan Marshall ?
              </p>
              {[
                { label: 'A. Le Plan Marshall est militaire, la doctrine Truman est économique', correct: false },
                { label: 'B. La doctrine Truman est idéologique et militaire, le Plan Marshall est économique', correct: true },
                { label: 'C. Les deux sont des aides économiques mais à des régions différentes', correct: false },
                { label: 'D. Il n\'y a pas de différence fondamentale entre les deux', correct: false },
              ].map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-start gap-3 p-3 rounded-[10px] text-sm mb-2 last:mb-0 ${
                    opt.correct
                      ? 'bg-green/10 border border-green/30 text-fg'
                      : 'border border-line text-fg-dim'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 ${opt.correct ? 'border-green bg-green/20' : 'border-line'}`} />
                  {opt.label}
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6">
              <span className="font-mono text-[11px] text-accent uppercase tracking-[0.12em]">Question ouverte</span>
              <p className="text-fg text-[15px] font-medium mt-3 mb-2">
                Expliquez les fondements du containment et son évolution entre 1947 et 1950.
              </p>
              <div className="text-fg-mute text-[12px] mt-3 p-3 bg-white/[0.03] rounded-[8px] border border-line">
                ✓ Réponse corrigée par IA avec feedback détaillé
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Annales */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            La fonctionnalité Annales
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-12">
            La meilleure préparation à un examen est de s&apos;entraîner sur des sujets similaires au vrai
            examen. Studra automatise la création d&apos;examens blancs dans le style exact de tes annales.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'Importe un vrai sujet',
                desc: "Importe un sujet d'examen passé (PDF ou texte). Studra analyse le style des questions, le niveau de difficulté, la structure et le vocabulaire utilisé.",
              },
              {
                n: '02',
                title: 'Studra clone le format',
                desc: "L'IA identifie les caractéristiques du sujet original : type de questions, longueur attendue des réponses, thèmes couverts, terminologie disciplinaire.",
              },
              {
                n: '03',
                title: 'Génère de nouveaux sujets',
                desc: "Studra génère de nouveaux examens blancs dans le même format avec un nouveau contenu. Idéal pour les concours avec des formats de sujets standardisés.",
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

      {/* Pourquoi */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Pourquoi s&apos;entraîner sur des examens blancs ?
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-10">
            La pratique de récupération (retrieval practice) est l&apos;une des deux seules techniques de
            révision classées &ldquo;efficacité élevée&rdquo; par la recherche cognitive.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Mémorisation plus profonde',
                desc: "Se tester sur un sujet encode l'information plus profondément que relire le cours. Chaque fois que ton cerveau reconstruit une réponse depuis la mémoire (plutôt que de lire), la trace mémorielle est renforcée.",
              },
              {
                title: "Identification des vraies lacunes",
                desc: "Les flashcards testent des éléments isolés. Un examen blanc révèle les lacunes structurelles — les concepts que tu ne saurais pas mobiliser dans un contexte réel, sous contrainte de temps.",
              },
              {
                title: "Réduction du stress le jour J",
                desc: "S'être entraîné plusieurs fois dans des conditions similaires à l'examen réduit significativement l'anxiété le jour de l'épreuve. Tu sais déjà comment te comporter sous pression.",
              },
              {
                title: "Feedback immédiat",
                desc: "La correction par IA donne un retour immédiat sur chaque réponse, avec une explication des erreurs. Contrairement à l'auto-correction, l'IA ne se trompe pas par indulgence.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-7"
              >
                <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-3">{card.title}</h3>
                <p className="text-fg-dim text-sm leading-[1.6]">{card.desc}</p>
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
            Passe en mode examen
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] mb-8">
            Génère ton premier examen blanc depuis ton cours en 30 secondes. Feedback IA sur chaque réponse.
            Gratuit, sans carte bancaire.
          </p>
          <Link href="/register" className="btn btn-primary">
            Générer mon examen blanc <span className="arrow">→</span>
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
                Identifie tes lacunes avec les examens blancs, puis ancre les concepts avec les flashcards FSRS 5.
              </p>
            </Link>
            <Link
              href="/repetition-espacee"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Répétition espacée</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Complète tes examens blancs avec des sessions FSRS 5 quotidiennes pour une mémorisation durable.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
