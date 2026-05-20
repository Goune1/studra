import Image from "next/image";

const COLS = [
  { brand: true },
  {
    title: "Produit",
    links: [
      { label: "Formats",        href: "#features" },
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs",         href: "#tarifs" },
      { label: "Changelog",      href: "/changelog" },
    ],
  },
  {
    title: "Fonctionnalités",
    links: [
      { label: "Flashcards IA",       href: "/flashcards-ia" },
      { label: "Fiches de révision IA", href: "/fiches-de-revision-ia" },
      { label: "Répétition espacée",   href: "/repetition-espacee" },
      { label: "Examens blancs IA",    href: "/examen-blanc-ia" },
      { label: "Blog",                 href: "/blog" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGU",             href: "/cgu" },
      { label: "CGV",             href: "/cgv" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
] as const;

function Footer() {
  return (
    <footer style={{ padding: "80px 0 32px", borderTop: "1px solid var(--ink-200)", background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, paddingBottom: 64 }} className="footer-grid-responsive">
          {COLS.map((col, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {"brand" in col ? (
                <>
                  <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 12 }}>
                    <Image src="/studra-logo.png" alt="Studra" width={40} height={40} unoptimized />
                    <span>Studra</span>
                  </a>
                  <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: "32ch" }}>
                    Réviser sans y passer ses nuits.
                  </p>
                </>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{col.title}</div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a href={l.href} className="footer-link">
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28, borderTop: "1px solid var(--ink-200)", fontSize: 13, color: "var(--ink-500)", flexWrap: "wrap", gap: 12 }}>
          <div>© 2026 Studra. Tous droits réservés.</div>
        </div>
      </div>

      <style>{`
        .footer-link { font-size: 14.5px; color: var(--ink-700); transition: color .15s; }
        .footer-link:hover { color: var(--ink); }
        @media (max-width: 760px) {
          .footer-grid-responsive { grid-template-columns: 1fr 1fr !important; gap: 32px 24px !important; padding-bottom: 48px !important; }
        }
        @media (max-width: 440px) {
          .footer-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
export { Footer };
