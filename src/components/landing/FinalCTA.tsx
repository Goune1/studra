import Link from "next/link";

export default function FinalCTA() {
  return (
    <section style={{ position: "relative", background: "var(--dark)", color: "var(--light)", padding: "140px 0", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        mixBlendMode: "screen",
      }} />

      <div className="container" style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "70fr 30fr", gap: 40, alignItems: "center" }} className="finalcta-grid-responsive">
          <h2 style={{ margin: 0, fontSize: "clamp(40px, 7vw, 88px)", fontWeight: 500, letterSpacing: "-.04em", lineHeight: 0.95, color: "var(--light)", textWrap: "balance" }}>
            <span>Tes examens arrivent.</span>
            <br />
            <span style={{ color: "rgba(245,245,244,.42)" }}>Studra aussi.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: "20px 32px", fontSize: 16, borderRadius: 12 }}>
              Commencer maintenant <span aria-hidden="true">→</span>
            </Link>
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(245,245,244,.45)", paddingLeft: 4 }}>
              Gratuit · sans carte
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .finalcta-grid-responsive { grid-template-columns: 1fr !important; gap: 32px !important; padding: 0 !important; }
          section[style*="140px"] { padding: 96px 0 !important; }
        }
      `}</style>
    </section>
  );
}
