import Link from 'next/link'

const pages = [
  {
    href: '/flashcards-ia',
    label: 'Créer des flashcards avec l\'IA',
    desc: 'Génère 10 à 25 flashcards depuis ton cours, PDF ou YouTube. Répétition espacée FSRS 5 intégrée.',
  },
  {
    href: '/fiches-de-revision-ia',
    label: 'Générer des fiches de révision automatiques',
    desc: 'Des fiches structurées avec titres, définitions et points clés — en 15 secondes depuis n\'importe quel cours.',
  },
  {
    href: '/repetition-espacee',
    label: 'La répétition espacée avec FSRS 5',
    desc: 'L\'algorithme le plus précis pour mémoriser durablement. Chaque carte modélisée individuellement.',
  },
  {
    href: '/examen-blanc-ia',
    label: 'Passer un examen blanc depuis son cours',
    desc: '7 QCM + 3 questions ouvertes corrigées par IA. Feedback détaillé, score mémorisé.',
  },
]

export function SeoLinks() {
  return (
    <section className="py-20 px-7 border-b border-line">
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Explorer en détail</span>
        <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em] mt-3.5 mb-10 max-w-[24ch]">
          Chaque fonctionnalité expliquée en profondeur.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[19px] leading-[1.2] tracking-[-0.015em] group-hover:text-accent transition-colors">
                {p.label}
              </h3>
              <p className="text-fg-dim text-sm leading-[1.6] flex-1">{p.desc}</p>
              <span className="text-accent text-sm mt-1">En savoir plus →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
