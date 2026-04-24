export function Testimonials() {
  return (
    <section id="testi" data-screen-label="Testimonials" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Ils ont performé</span>
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch]">
          Les étudiants qui refusent de <em className="italic text-[#c4b5fd]">perdre du temps.</em>
        </h2>

        <div className="grid md:grid-cols-3 gap-4.5 mt-12">
          <Testimonial big quote="« Avant Studra je passais des week-ends entiers à faire des fiches. Maintenant je génère la fiche en 30 secondes, je passe le reste du temps à vraiment apprendre avec le mode Socrate. Mes notes ont pris 3 points en un semestre. »" name="Leny D" role="L2 Droit · Université Toulouse Capitole" initials="LD" />
          <Testimonial quote="« Le mode Socrate m'a fait réaliser que je pensais savoir des trucs que je ne savais pas du tout. C'est brutal mais efficace. »" name="Théo Rambaud" role="PASS · Sorbonne Université" initials="TR" gradient="from-pink to-amber" />
          <Testimonial quote="« La frise chronologique a fait gagner 2h sur chaque chapitre d'histoire contemporaine. C'est bête mais c'est la feature que j'utilise le plus. »" name="Camille Dussart" role="Prépa HEC · Louis-le-Grand" initials="CD" gradient="from-green to-[#22d3ee]" />
          <Testimonial quote="« Le planning a géré mes 6 semaines de préparation aux partiels. Je me suis juste laissée guider. »" name="Sarah Mboup" role="M1 Finance · Dauphine" initials="SM" gradient="from-accent to-[#22d3ee]" />
        </div>
      </div>
    </section>
  );
}

function Testimonial({
  quote,
  name,
  role,
  initials,
  big,
  gradient,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
  big?: boolean;
  gradient?: string;
}) {
  return (
    <article className={`bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 flex flex-col gap-5 ${big ? 'md:col-span-2' : ''}`}>
      <p className={`font-serif leading-[1.3] tracking-[-0.015em] flex-1 ${big ? 'text-[30px]' : 'text-[22px]'}`}>{quote}</p>
      <div className="flex items-center gap-3 pt-4.5 border-t border-line">
        <div
          className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-semibold text-sm text-white bg-gradient-to-br ${
            gradient ?? 'from-accent to-accent-2'
          }`}
        >
          {initials}
        </div>
        <div className="flex flex-col">
          <strong className="text-sm font-medium">{name}</strong>
          <span className="text-xs text-fg-mute">{role}</span>
        </div>
      </div>
    </article>
  );
}
