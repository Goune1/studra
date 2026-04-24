export function FAQ() {
  const items = [
    {
      q: 'Studra remplace-t-il mes cours ?',
      a: "Non. Studra est un outil de révision : il prend ton cours existant (PDF, notes, vidéo) et le transforme en supports d'apprentissage actif. Le contenu vient toujours de toi. On ne fait qu'accélérer la mise en forme et l'entraînement.",
      open: true,
    },
    {
      q: 'Combien de temps pour générer une fiche ?',
      a: "Entre 5 et 30 secondes selon la longueur du cours et le format choisi. Une fiche de 10 pages prend environ 15 secondes ; un examen blanc complet environ 40 secondes.",
    },
    {
      q: 'Quels formats de fichier sont acceptés ?',
      a: "PDF (y compris scannés, grâce à l'OCR), texte brut collé, et liens YouTube (nous extrayons automatiquement la transcription). Word et Pages arrivent dans les prochaines semaines.",
    },
    {
      q: 'Mes cours sont-ils en sécurité ?',
      a: "Oui. Tes contenus sont chiffrés, stockés sur Supabase (RGPD, hébergement UE) et protégés par Row Level Security. Ils ne servent jamais à entraîner des modèles tiers.",
    },
    {
      q: "Puis-je annuler mon abonnement Pro ?",
      a: "Oui, à tout moment depuis le portail client Stripe. Tu gardes l'accès Pro jusqu'à la fin de la période en cours, sans frais cachés.",
    },
    {
      q: 'Est-ce que ça marche pour toutes les matières ?',
      a: "Oui. Sciences dures, droit, médecine, sciences humaines, langues. Studra s'adapte au type de contenu détecté. Les frises sont particulièrement utiles en histoire et droit ; les schémas brillent en biologie et en économie.",
    },
  ];
  return (
    <section id="faq" data-screen-label="FAQ" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto text-center">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">FAQ</span>
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch] mx-auto">
          Questions <em className="italic text-[#c4b5fd]">fréquentes.</em>
        </h2>

        <div className="max-w-[820px] mx-auto mt-15 border-t border-line text-left">
          {items.map((it, i) => (
            <details key={i} className="faq border-b border-line py-5 px-1 cursor-pointer" open={it.open}>
              <summary className="flex justify-between items-center gap-4 cursor-pointer">
                <span className="font-serif text-[22px] tracking-[-0.015em]">{it.q}</span>
                <span className="faq-plus" />
              </summary>
              <p className="text-fg-dim text-[15px] leading-[1.6] pt-3.5 pb-1.5 max-w-[68ch]">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
