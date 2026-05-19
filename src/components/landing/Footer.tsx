import Image from "next/image";

const COLS = [
  { brand: true },
  { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Méthode", "Changelog"] },
  { title: "Ressources", links: ["Blog", "Guide du bac", "Aide"] },
  { title: "Légal", links: ["CGU", "Confidentialité", "RGPD", "Mentions légales"] },
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
                  <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 12 }}>
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
                      <li key={l}>
                        <a href="#" className="footer-link">
                          {l}
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>Made in France</span>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0055A4", display: "inline-block" }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFFFFF", border: "1px solid rgba(0,0,0,.1)", display: "inline-block" }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4135", display: "inline-block" }} />
          </div>
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
