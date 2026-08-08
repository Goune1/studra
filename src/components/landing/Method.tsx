const BLOCKS = [
  {
    title: "La répétition espacée, expliquée simplement.",
    body: "Ton cerveau oublie selon une courbe prévisible. Réviser juste avant d'oublier ancre l'information en mémoire long terme. Studra calcule ce moment pour chaque carte avec l'algorithme de répétition espacée le plus précis disponible aujourd'hui (FSRS-5, le même standard que la recherche en sciences cognitives).",
  },
  {
    title: "Le rappel actif, pas le surlignage.",
    body: "Relire ses cours ne marche pas. Se forcer à retrouver l'information sans regarder, si. Studra te met dans cette position systématiquement, sur flashcards, en rappel libre, en examen blanc.",
  },
  {
    title: "La maïeutique, version 2026.",
    body: "Si tu peux expliquer un concept à voix haute en répondant à des questions précises, tu l'as compris. Sinon, tu ne l'as pas compris. Le Mode Socrate met cette vérité en pratique avec une IA qui te pose les bonnes questions.",
  },
];

export default function Method() {
  return (
    <section id="methode" style={{ padding: "120px 0 100px" }}>
      <div className="container method-grid-responsive" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 40, alignItems: "start" }}>
        <div style={{ position: "sticky", top: 120, height: "100%", display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }} className="method-rail-responsive">
          <div className="mono method-vertical-responsive" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 13, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--ink-400)", whiteSpace: "nowrap" }}>
            La Méthode
          </div>
        </div>

        <div style={{ maxWidth: "64ch" }}>
          {BLOCKS.map((block, i) => (
            <div key={block.title}>
              {i > 0 && <div style={{ height: 1, background: "var(--ink-200)", width: "60%", margin: "32px 0" }} />}
              <div style={{ padding: "8px 0" }}>
                <h3 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.2, margin: "0 0 16px", color: "var(--ink)", textWrap: "balance" }}>{block.title}</h3>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "var(--ink-700)" }}>{block.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .method-grid-responsive { display: grid; }
        @media (max-width: 900px) {
          .method-grid-responsive { grid-template-columns: 1fr !important; gap: 24px !important; }
          .method-rail-responsive { position: relative !important; top: 0 !important; }
          .method-vertical-responsive { writing-mode: horizontal-tb !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
