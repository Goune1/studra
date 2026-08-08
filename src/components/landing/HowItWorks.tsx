const STEPS = [
  { n: "01", title: "Choisis ton outil.", body: "Flashcards, fiche, schéma, frise, examen blanc, dialogue socratique. Tout sort du même cours." },
  { n: "02", title: "Colle ton cours.", body: "Texte, PDF, image ou lien YouTube. Studra lit, structure, comprend." },
  { n: "03", title: "Révise sans réfléchir.", body: "L'algorithme te dit quoi réviser et quand. Tu ouvres l'app, tu fais ce qui apparaît." },
];

function Step({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div style={{ position: "relative", paddingTop: 64 }}>
      <div aria-hidden="true" className="mono" style={{ position: "absolute", top: -28, left: -8, fontSize: "clamp(120px, 14vw, 180px)", lineHeight: 1, fontWeight: 500, color: "#8A8A93", letterSpacing: "-.06em", pointerEvents: "none", userSelect: "none" }}>
        {step.n}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.025em", color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>{step.title}</div>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: "36ch" }}>{step.body}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="sec" id="methode-bref">
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 80, maxWidth: 720 }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>Comment ça marche</span>
          </div>
          <h2 className="section-h">
            Trois étapes.<br />
            <span className="dim">Pas plus.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }} className="hiw-grid-responsive">
          {STEPS.map((step) => <Step key={step.n} step={step} />)}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hiw-grid-responsive {
            grid-auto-flow: column !important;
            grid-template-columns: none !important;
            grid-auto-columns: 80% !important;
            gap: 24px !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            margin: 0 -20px;
            padding: 0 20px 16px;
            scrollbar-width: none;
          }
          .hiw-grid-responsive::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  );
}
