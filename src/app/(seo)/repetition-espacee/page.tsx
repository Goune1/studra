import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Répétition espacée gratuite avec IA — Mémorise plus en moins de temps | Studra',
  description:
    'Studra utilise l\'algorithme FSRS 5 pour planifier tes révisions au moment optimal. Mémorise durablement sans effort inutile. Gratuit, sans installation.',
  alternates: {
    canonical: 'https://studra.fr/repetition-espacee',
    languages: { fr: 'https://studra.fr/repetition-espacee' },
  },
  openGraph: {
    title: 'Répétition espacée gratuite avec IA — Mémorise plus en moins de temps | Studra',
    description:
      'Studra utilise l\'algorithme FSRS 5 pour planifier tes révisions au moment optimal. Mémorise durablement sans effort inutile. Gratuit, sans installation.',
    url: 'https://studra.fr/repetition-espacee',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Répétition espacée gratuite avec IA | Studra',
    description:
      'Studra utilise l\'algorithme FSRS 5 pour planifier tes révisions au moment optimal. Mémorise durablement.',
  },
}

const faqItems = [
  {
    q: "Qu'est-ce que la répétition espacée ?",
    a: "La répétition espacée consiste à revoir une information à intervalles croissants, calculés pour coïncider avec le moment où tu vas l'oublier. Chaque révision réussie renforce la trace mémorielle et allonge l'intervalle suivant, construisant une mémoire durable avec un minimum de temps.",
  },
  {
    q: "Quelle est la différence entre FSRS 5 et SM-2 (Anki) ?",
    a: "SM-2 utilise un facteur de facilité global pour chaque carte. FSRS 5 modélise deux paramètres individuels par carte : la stabilité (durée estimée avant oubli) et la difficulté intrinsèque. FSRS est optimisé sur des millions de révisions réelles et réduit le nombre de révisions nécessaires de 15 à 20 % par rapport à SM-2.",
  },
  {
    q: "Combien de temps par jour faut-il réviser avec la répétition espacée ?",
    a: "15 à 30 minutes de révision quotidienne avec FSRS 5 sont plus efficaces qu'une session de 3 heures le week-end. La régularité est la clé : l'algorithme planifie les cartes pour que tu ne te souviennes de rien 24h à 48h avant de l'oublier.",
  },
  {
    q: "La répétition espacée fonctionne-t-elle pour toutes les matières ?",
    a: "La répétition espacée est particulièrement puissante pour les matières à fort volume factuel : médecine, droit, langues, histoire, économie. Elle est moins adaptée aux matières purement procédurales (résolution de problèmes de maths), mais reste utile pour mémoriser les définitions, théorèmes et formules.",
  },
  {
    q: "Studra est-il vraiment gratuit pour la répétition espacée ?",
    a: "Oui. Le plan gratuit inclut l'accès complet à l'algorithme FSRS 5 avec 5 générations par mois (flashcards + répétition espacée). Le plan Pro débloque les générations illimitées et le planning de révision personnalisé.",
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

export default function RepetitionEspaceePage() {
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
            La répétition espacée scientifiquement prouvée pour mémoriser plus
          </h1>
          <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6] mb-10">
            Studra utilise l&apos;algorithme FSRS 5 pour planifier chaque révision au moment exact où tu vas
            oublier. Mémorisation longue durée, sans bachotage de dernière minute.
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
              Sa conclusion : sans révision, on oublie{' '}
              <strong className="text-fg">environ 50 % d&apos;une information nouvelle en 1 heure</strong>, 70 %
              en 24 heures, et 90 % en une semaine.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
              La bonne nouvelle : chaque révision juste avant l&apos;oubli interrompt cette courbe. La trace
              mémorielle est renforcée et la nouvelle courbe d&apos;oubli est plus lente. Après 5 à 6 révisions
              espacées, l&apos;information est en mémoire à long terme.
            </p>
            <p className="text-fg-dim text-[16px] leading-[1.65]">
              L&apos;enjeu algorithmique est de prédire{' '}
              <strong className="text-fg">exactement quand tu vas oublier</strong> chaque élément — et de
              planifier la révision à ce moment précis. C&apos;est ce que fait FSRS 5, carte par carte.
            </p>
          </div>
          {/* Courbe visuelle simplifiée */}
          <div className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-8">
            <h3 className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase mb-6">
              Effet des révisions sur la rétention
            </h3>
            {[
              { label: 'Sans révision (J+7)', pct: 10, color: 'bg-[#ef4444]' },
              { label: 'Après 1 révision (J+7)', pct: 40, color: 'bg-amber' },
              { label: 'Après 3 révisions espacées', pct: 72, color: 'bg-[rgba(99,102,241,0.7)]' },
              { label: 'Après 6 révisions FSRS', pct: 92, color: 'bg-gradient-to-r from-accent to-accent-2' },
            ].map((row) => (
              <div key={row.label} className="mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-1.5 text-[13px]">
                  <span className="text-fg-dim">{row.label}</span>
                  <span className="font-mono text-fg-mute">{row.pct} %</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="text-fg-mute text-[11px] mt-6">Valeurs indicatives basées sur les modèles Ebbinghaus / FSRS</p>
          </div>
        </div>
      </section>

      {/* FSRS 5 */}
      <section className="py-20 px-7 border-b border-line">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.02em] mb-5">
            FSRS 5 : l&apos;algorithme le plus précis disponible aujourd&apos;hui
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
                SM-2, l&apos;algorithme historique d&apos;Anki, utilise un facteur de facilité global pour chaque
                carte. Ce système produit un phénomène connu sous le nom d&apos;
                <em className="text-fg">ease hell</em> : les cartes difficiles obtiennent des intervalles de
                plus en plus courts, indépendamment de ta vraie progression.
              </p>
              <p className="text-fg-dim text-[16px] leading-[1.65] mb-5">
                FSRS (Free Spaced Repetition Scheduler) résout ce problème en modélisant deux variables
                indépendantes pour chaque carte :
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
                FSRS 5 a été optimisé sur des millions de révisions réelles d&apos;utilisateurs Anki. Les études
                comparatives montrent une réduction de 15 à 20 % du nombre de révisions nécessaires pour maintenir
                un taux de rétention de 90 %.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Version utilisée par Studra', val: 'FSRS 5 (dernière version)' },
                { label: 'Paramètres par carte', val: '2 (stabilité S + difficulté D)' },
                { label: 'Niveaux d\'évaluation', val: '4 (Encore / Difficile / Bien / Facile)' },
                { label: 'Taux de rétention cible', val: '90 % par défaut' },
                { label: 'vs SM-2', val: '−15 à −20 % de révisions à rétention égale' },
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
              <h3 className="font-serif text-[22px] tracking-[-0.015em] mt-3 mb-3">Créer les cartes prend des heures</h3>
              <p className="text-fg-dim text-sm leading-[1.6]">
                Avec Anki, créer 50 flashcards depuis un cours de 20 pages prend 2 à 3 heures. Ce temps de
                création est du temps que tu ne passes pas à réviser. Et la qualité des cartes dépend entièrement
                de ta capacité à identifier les bons concepts.
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#15152e] to-[#0e0e1c] border border-[rgba(99,102,241,0.4)] rounded-[20px] p-7 shadow-[0_20px_60px_-20px_rgba(99,102,241,0.4)]">
              <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">Solution Studra</span>
              <h3 className="font-serif text-[22px] tracking-[-0.015em] mt-3 mb-3">IA + FSRS 5 en 30 secondes</h3>
              <p className="text-fg-dim text-sm leading-[1.6]">
                Studra génère les flashcards depuis ton cours en 10 à 30 secondes, avec FSRS 5 déjà configuré.
                Tu n&apos;as plus qu&apos;à réviser. L&apos;algorithme planifie automatiquement chaque carte selon
                son état dans ta mémoire. Pas de gestion manuelle.
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
