import Image from "next/image";
import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

const COLS = [
  { brand: true },
  {
    titleKey: 'product',
    links: [
      { labelKey: 'formats',        href: "#features" },
      { labelKey: 'features', href: "#features" },
      { labelKey: 'pricing',         href: "#tarifs" },
      { labelKey: 'changelog',      href: "/changelog" },
    ],
  },
  {
    titleKey: 'featureColumn',
    links: [
      { labelKey: 'flashcards',       href: "/flashcards-ia" },
      { labelKey: 'fiches', href: "/fiches-de-revision-ia" },
      { labelKey: 'spacing',   href: "/repetition-espacee" },
      { labelKey: 'exams',    href: "/examen-blanc-ia" },
      { labelKey: 'blog',                 href: "/blog" },
    ],
  },
  {
    titleKey: 'legal',
    links: [
      { labelKey: 'terms',             href: "/cgu" },
      { labelKey: 'salesTerms',             href: "/cgv" },
      { labelKey: 'privacy', href: "/confidentialite" },
    ],
  },
] as const;

function Footer() {
  const t = useTranslations('landing.footer')
  return (
    <footer style={{ padding: "80px 0 32px", borderTop: "1px solid var(--ink-200)", background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, paddingBottom: 64 }} className="footer-grid-responsive">
          {COLS.map((col, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {"brand" in col ? (
                <>
                  <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 12 }}>
                    <Image src="/studra-logo.png" alt="Studra" width={40} height={40} />
                    <span>Studra</span>
                  </Link>
                  <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: "32ch" }}>
                    {t('tagline')}
                  </p>
                </>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{t(col.titleKey)}</div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map((l) => (
                      <li key={l.labelKey}>
                        <Link href={l.href} className="footer-link">
                          {t(l.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28, borderTop: "1px solid var(--ink-200)", fontSize: 13, color: "var(--ink-500)", flexWrap: "wrap", gap: 12 }}>
          <div>{t('copyright')}</div>
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
