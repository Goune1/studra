import Link from 'next/link';

export function Pricing() {
  const freeCta = <Link href="/register" className="btn btn-outline justify-center mt-auto">Créer mon compte</Link>;
  const proCta = <Link href="/register" className="btn btn-primary justify-center mt-auto">Passer Pro <span className="arrow">→</span></Link>;

  return (
    <section id="pricing" data-screen-label="Pricing" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto text-center">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Tarifs</span>
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch] mx-auto">
          Commence gratuit. <em className="italic text-[#c4b5fd]">Passe Pro quand tu veux.</em>
        </h2>
        <p className="text-[17px] text-fg-dim max-w-[58ch] leading-[1.55] mx-auto">
          Pas de période d&apos;essai piégeuse. Pas de facture surprise. Annule en un clic.
        </p>

        <div className="grid md:grid-cols-2 gap-4.5 mt-15 max-w-[900px] mx-auto text-left">
          <Plan
            name="Gratuit"
            price="0 €"
            unit="/pour toujours"
            sub="Pour découvrir la méthode Studra sur un chapitre ou une fiche."
            features={[
              '5 générations par mois',
              'Accès à tous les formats',
              'Import PDF · texte · YouTube',
              'Répétition espacée FSRS',
            ]}
            cta={freeCta}
          />
          <Plan
            pro
            name="Pro"
            price="4,99 €"
            unit="/mois"
            sub="Pour les étudiants qui veulent passer au niveau au-dessus, sans limite."
            features={[
              <span key="gen">Générations <strong className="text-fg">illimitées</strong></span>,
              'Mode Socrate',
              "Planning d'examen personnalisé",
              'Analyse des lacunes avancée',
              'Toutes les futures fonctionnalités',
            ]}
            cta={proCta}
          />
        </div>
      </div>
    </section>
  );
}

function Plan({
  name,
  price,
  unit,
  sub,
  features,
  cta,
  pro,
}: {
  name: string;
  price: string;
  unit: string;
  sub: string;
  features: React.ReactNode[];
  cta: React.ReactNode;
  pro?: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[22px] p-9 flex flex-col gap-5 border ${
        pro
          ? 'plan-pro border-[rgba(99,102,241,0.4)] bg-gradient-to-b from-[#15152e] to-[#0e0e1c] shadow-[0_40px_80px_-40px_rgba(99,102,241,0.55)]'
          : 'border-line bg-gradient-to-b from-surface to-bg-2'
      }`}
    >
      {pro && (
        <span className="absolute top-5 right-5 font-mono text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full bg-accent-gradient text-white">
          Recommandé
        </span>
      )}
      <div className="font-serif text-[28px] tracking-[-0.02em]">{name}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-[64px] tracking-[-0.03em] leading-none">{price}</span>
        <span className="text-fg-mute text-sm">{unit}</span>
      </div>
      <p className="text-fg-dim text-sm leading-[1.5]">{sub}</p>
      <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-fg-dim">
            <span className="tick" />
            {f}
          </li>
        ))}
      </ul>
      {cta}
    </article>
  );
}
