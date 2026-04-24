export function HowItWorks() {
  const steps = [
    { n: '01', t: 'Importe', d: "Glisse un PDF, colle un texte ou un lien YouTube. Studra extrait et nettoie le contenu automatiquement." },
    { n: '02', t: 'Génère', d: "Choisis un format ou plusieurs. Flashcards, fiche, schéma, frise, examen. Prêts en quelques secondes." },
    { n: '03', t: 'Maîtrise', d: "Révise avec les Flashcard, le mode Socrate ou le mode examen. L'IA détecte tes lacunes et adapte ton planning jusqu'au jour J." },
  ];
  return (
    <section id="how" data-screen-label="How" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">En 3 étapes</span>
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch]">
          De ton cours à la <em className="italic text-[#c4b5fd]">maîtrise</em>, en moins d&apos;une minute.
        </h2>

        <div className="grid md:grid-cols-3 gap-4.5 mt-15">
          {steps.map((s) => (
            <article key={s.n} className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-8 min-h-[320px] flex flex-col gap-4 relative">
              <div className="step-num font-serif text-[92px] leading-[0.8] tracking-[-0.04em]">{s.n}</div>
              <h3 className="font-serif text-[26px] tracking-[-0.02em] m-0">{s.t}</h3>
              <p className="text-fg-dim text-sm leading-[1.55]">{s.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
