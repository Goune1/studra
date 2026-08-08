import Link from "next/link";

const FREE = {
  name: "Free", price: "0", desc: "Pour découvrir Studra sans carte bancaire.",
  cta: "Commencer gratuitement", ctaStyle: "btn-outline", href: "/register",
  features: ["5 générations IA par mois, tous outils confondus", "Flashcards, fiches, examens et schémas", "Import texte et PDF", "Répétition espacée FSRS", "Mode Socrate", "Planning de révision"],
};
const PRO = {
  name: "Pro", price: "4,99", desc: "Pour réviser plusieurs matières sans limite de génération.",
  cta: "Passer à Pro", ctaStyle: "btn-primary", recommended: true, href: "/register?plan=pro",
  features: ["Tout le plan Free", "Générations IA illimitées", "Import YouTube", "Analyse des lacunes", "Annales adaptatives", "Planning personnalisé", "Mode Socrate illimité"],
};

function PlanCard({ plan }: { plan: typeof FREE & { recommended?: boolean; href: string } }) {
  return (
    <div style={{
      position: "relative",
      background: "var(--bg-elev)",
      border: `1px solid ${plan.recommended ? "var(--accent)" : "var(--line)"}`,
      boxShadow: plan.recommended ? "0 0 0 1px var(--accent) inset" : "none",
      borderRadius: 24,
      padding: 40,
      display: "flex", flexDirection: "column", gap: 24,
    }}>
      {plan.recommended && (
        <div className="mono" style={{ position: "absolute", top: 18, right: 24, fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 500 }}>
          Recommandé
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 52, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1, color: "var(--ink)", fontFeatureSettings: "'tnum'" }}>{plan.price}</span>
          <span style={{ fontSize: 22, color: "var(--ink)", fontWeight: 500 }}>
            €<span style={{ color: "var(--ink-500)", fontSize: 16, fontWeight: 400 }}>/mois</span>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--ink-700)", maxWidth: "36ch" }}>{plan.desc}</p>
      </div>

      <Link href={plan.href} className={`btn ${plan.ctaStyle}`} style={{ width: "100%", padding: "14px 20px", justifyContent: "center" }}>{plan.cta}</Link>

      <div style={{ height: 1, background: "var(--ink-200)" }} />

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {plan.features.map((feature) => (
          <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, lineHeight: 1.45, color: "var(--ink-700)" }}>
            <span aria-hidden="true" style={{ color: "var(--accent)", flexShrink: 0, display: "inline-flex", marginTop: 2 }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="sec" id="tarifs">
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 56, maxWidth: 760 }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>Tarifs</span>
          </div>
          <h2 className="section-h">
            Gratuit pour commencer.<br />
            <span className="dim">Pas cher pour aller au bout.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }} className="plans-grid-responsive">
          <PlanCard plan={FREE} />
          <PlanCard plan={PRO} />
        </div>

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-500)" }}>
          Une génération correspond à la création d&apos;un support ou d&apos;une analyse par IA.<br />
          Réviser des flashcards déjà créées ne consomme pas de génération. Annulable à tout moment, sans engagement.
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plans-grid-responsive { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .plans-grid-responsive > div { padding: 32px 28px !important; }
        }
      `}</style>
    </section>
  );
}
