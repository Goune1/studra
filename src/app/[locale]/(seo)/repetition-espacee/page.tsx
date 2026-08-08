import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Répétition espacée avec FSRS',
  description:
    'Studra utilise FSRS pour estimer le prochain intervalle de révision à partir de tes réponses. Intervalles visibles, quatre choix et accès gratuit.',
  alternates: {
    canonical: 'https://studra.fr/repetition-espacee',
  },
  openGraph: {
    title: 'Répétition espacée avec FSRS | Studra',
    description:
      'Studra utilise FSRS pour estimer le prochain intervalle de révision à partir de tes réponses. Intervalles visibles et quatre choix.',
    url: 'https://studra.fr/repetition-espacee',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Répétition espacée gratuite avec FSRS | Studra',
    description:
      'Studra estime le prochain intervalle de révision à partir de tes réponses et te laisse choisir entre quatre évaluations.',
  },
}

const faqItems = [
  {
    q: "Qu'est-ce que la répétition espacée ?",
    a: "La répétition espacée consiste à revoir une information à des intervalles adaptés à tes réponses précédentes. Une réponse réussie tend à allonger l'intervalle ; un oubli rapproche la prochaine révision.",
  },
  {
    q: "Quelle est la différence entre FSRS et SM-2 ?",
    a: "SM-2 est un algorithme historique fondé sur des heuristiques et un facteur de facilité. FSRS modélise notamment la stabilité et la difficulté de chaque carte. Anki prend aujourd'hui lui aussi en charge FSRS ; Studra l'intègre directement dans son parcours de révision.",
  },
  {
    q: "Combien de temps par jour faut-il réviser avec la répétition espacée ?",
    a: "Cela dépend du nombre de cartes et de leur difficulté. L'objectif est de traiter régulièrement les cartes arrivées à échéance plutôt que d'imposer une durée quotidienne identique à tout le monde.",
  },
  {
    q: "La répétition espacée fonctionne-t-elle pour toutes les matières ?",
    a: "La répétition espacée est particulièrement puissante pour les matières à fort volume factuel : médecine, droit, langues, histoire, économie. Elle est moins adaptée aux matières purement procédurales (résolution de problèmes de maths), mais reste utile pour mémoriser les définitions, théorèmes et formules.",
  },
  {
    q: "Studra est-il vraiment gratuit pour la répétition espacée ?",
    a: "Oui. Le plan gratuit inclut 5 générations IA par mois. Une fois les flashcards créées, leurs révisions avec FSRS ne consomment pas de génération supplémentaire. Le plan Pro débloque les générations IA illimitées.",
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
      name: 'Répétition espacée',
      item: 'https://studra.fr/repetition-espacee',
    },
  ],
}

export default async function RepetitionEspaceePage({params}: {params: Promise<{locale: string}>}) {
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
            <span className="text-fg">Répétition espacée</span>
          </nav>
          <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Science de la mémoire</span>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-6 max-w-[16ch]">
            La répétition espacée, sans boîte noire
          </h1>
          <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6] mb-10">
            Studra utilise FSRS pour estimer quand revoir chaque carte. Avant de répondre, tu vois les intervalles
            proposés et tu gardes le choix : Encore, Difficile, Bien ou Facile.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-primary">
              Commencer gratuitement <span className="arrow">→</span>
            </Link>
            <Link href="/flashcards-ia" className="btn btn-outline">
              Créer mes flashcards
            </Link>
          </div>
        </div>
      </section>

      {/* Courbe de l'oubli */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
              La courbe de l&apos;oubli d&apos;Ebbinghaus
            </h2>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              En 1885, le psychologue Hermann Ebbinghaus a établi le premier modèle mathématique de l&apos;oubli.
              Ses expériences montrent surtout une tendance :{' '}
              <strong className="text-fg">le rappel diminue avec le temps lorsqu&apos;une information n&apos;est pas revue</strong>.
              La vitesse réelle varie selon le contenu, la personne et les conditions d&apos;apprentissage.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              La répétition espacée organise les rappels à des intervalles variables. Une réponse réussie permet
              généralement d&apos;espacer davantage la carte ; un oubli la fait revenir plus tôt. Il n&apos;existe pas
              de courbe universelle ni de nombre magique de révisions.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65]">
              FSRS ne lit pas ta mémoire. Il{' '}
              <strong className="text-fg">estime un prochain intervalle</strong> à partir de l&apos;historique de la
              carte et de l&apos;évaluation que tu choisis après chaque réponse.
            </p>
          </div>
          {/* Courbe visuelle simplifiée */}
          <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-8">
            <h3 className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase mb-6">
              Effet des révisions sur la rétention
            </h3>
            {[
              { label: 'Carte nouvelle', detail: 'Révision rapprochée', width: '24%', color: 'bg-[#ef4444]' },
              { label: 'Réponse « Difficile »', detail: 'Intervalle prudent', width: '42%', color: 'bg-amber' },
              { label: 'Réponse « Bien »', detail: 'Intervalle allongé', width: '68%', color: 'bg-[rgba(99,102,241,0.7)]' },
              { label: 'Réponse « Facile »', detail: 'Intervalle plus long', width: '88%', color: 'bg-gradient-to-r from-accent to-accent-2' },
            ].map((row) => (
              <div key={row.label} className="mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-1.5 text-[13px]">
                  <span className="text-fg-dim">{row.label}</span>
                  <span className="font-mono text-fg-mute">{row.detail}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: row.width }} />
                </div>
              </div>
            ))}
            <p className="text-fg-mute text-[11px] mt-6">Illustration conceptuelle : les intervalles réels dépendent de chaque carte.</p>
          </div>
        </div>
      </section>

      {/* FSRS */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Comment FSRS choisit le prochain intervalle
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
                SM-2 est un algorithme historique qui repose sur des heuristiques et un facteur de facilité.
                FSRS utilise un modèle différent fondé sur l&apos;historique de chaque carte. Anki prend désormais
                lui aussi en charge FSRS : ce n&apos;est donc pas une exclusivité Studra.
              </p>
              <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
                FSRS (Free Spaced Repetition Scheduler) modélise notamment deux variables pour chaque carte :
              </p>
              <ul className="space-y-3 mb-5">
                <li className="flex items-start gap-3 text-fg-dim text-[15px]">
                  <span className="mt-1 w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] text-accent flex-shrink-0">S</span>
                  <div>
                    <strong className="text-fg">Stabilité</strong> — combien de temps tu vas te souvenir de
                    cette carte avant de l&apos;oublier. Augmente avec chaque révision réussie.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-fg-dim text-[15px]">
                  <span className="mt-1 w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] text-accent flex-shrink-0">D</span>
                  <div>
                    <strong className="text-fg">Difficulté</strong> — la difficulté intrinsèque de la carte
                    (propriété du contenu, pas de l&apos;utilisateur). Calibrée après les premières révisions.
                  </div>
                </li>
              </ul>
              <p className="text-fg-dim text-[16px] leading-[1.65]">
                Dans Studra, les quatre boutons affichent le prochain intervalle avant ton choix. Ton évaluation
                met ensuite à jour l&apos;état de la carte et sa prochaine date de révision.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Implémentation', val: 'Bibliothèque open source ts-fsrs' },
                { label: 'Paramètres par carte', val: '2 (stabilité S + difficulté D)' },
                { label: 'Niveaux d\'évaluation', val: '4 (Encore / Difficile / Bien / Facile)' },
                { label: 'Taux de rétention cible', val: '90 % par défaut' },
                { label: 'Avant chaque choix', val: 'Aperçu du prochain intervalle' },
                { label: 'Open source', val: 'Oui (github.com/open-spaced-repetition)' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[14px] px-5 py-4 flex justify-between items-center gap-4"
                >
                  <span className="text-fg-dim text-sm">{row.label}</span>
                  <span className="text-fg text-sm font-medium text-right">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Studra automatise tout */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            Studra automatise tout
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] max-w-[58ch] mb-12">
            La répétition espacée est la partie facile. Le vrai défi, c&apos;est de créer les cartes. Studra
            résout les deux problèmes simultanément.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[20px] p-7">
              <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">Problème traditionnel</span>
              <h3 className="font-serif text-[22px] tracking-[-0.015em] mt-3 mb-3">Créer les cartes demande un tri manuel</h3>
              <p className="text-fg-dim text-sm leading-[1.6]">
                Avec un outil de flashcards classique, tu dois identifier les concepts, formuler chaque question
                et saisir les réponses. Ce contrôle est utile, mais il peut ralentir le passage du cours à la pratique.
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#15152e] to-[#0e0e1c] border border-[rgba(99,102,241,0.4)] rounded-[20px] p-7 shadow-[0_20px_60px_-20px_rgba(99,102,241,0.4)]">
              <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">Solution Studra</span>
              <h3 className="font-serif text-[22px] tracking-[-0.015em] mt-3 mb-3">Génération assistée + FSRS intégré</h3>
              <p className="text-fg-dim text-sm leading-[1.6]">
                Studra transforme ton cours en flashcards puis initialise leur planification FSRS. Pendant la
                révision, chaque choix met à jour l&apos;intervalle de la carte ; tu vois ce délai avant de valider.
              </p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px]">
            <p className="text-fg-dim text-[15px] leading-[1.6] text-center max-w-[70ch] mx-auto">
              La combinaison génération IA + répétition espacée FSRS 5 est particulièrement puissante pour les
              étudiants en médecine, en droit et en langues qui doivent maîtriser des centaines de concepts sur
              plusieurs matières en parallèle.
            </p>
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
            Commence à mémoriser avec FSRS 5
          </h2>
          <p className="text-fg-dim text-[16px] leading-[1.6] mb-8">
            Génère tes premières flashcards depuis ton cours et laisse Studra planifier tes révisions. Gratuit,
            sans installation, sans carte bancaire.
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
              href="/flashcards-ia"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Flashcards IA</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Génère tes flashcards depuis un PDF ou YouTube, puis révise avec FSRS 5 intégré.
              </p>
            </Link>
            <Link
              href="/examen-blanc-ia"
              className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[20px] tracking-[-0.015em] mb-2">Examens blancs IA</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">
                Complète la répétition espacée avec des examens blancs pour pratiquer la récupération active.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
