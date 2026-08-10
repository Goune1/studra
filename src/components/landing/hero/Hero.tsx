import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
import MockupWindow from "./MockupWindow";

export default function Hero() {
  const t = useTranslations('landing.hero')
  return (
    <section style={{ position: "relative", minHeight: "100dvh", paddingTop: 96, paddingBottom: 60, display: "flex", alignItems: "center", overflowX: "hidden" }}>
      {/* Ebbinghaus forgetting curve — hidden on mobile */}
      <svg
        aria-hidden="true"
        className="hero-ebb"
        viewBox="0 0 1400 600"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 120, left: -40, right: -40, width: "calc(100% + 80px)", height: "70%", color: "var(--ink)", opacity: 0.15, pointerEvents: "none", zIndex: 0 }}
      >
        <defs>
          <linearGradient id="ebb-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.0" />
            <stop offset="20%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="80%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path className="ebb-curve" d="M0 80 C 200 100, 280 380, 520 460 C 700 510, 760 520, 820 500" stroke="url(#ebb-grad)" strokeWidth="1.5" fill="none" />
        <path className="ebb-curve" d="M520 200 C 720 230, 800 420, 1000 470" stroke="url(#ebb-grad)" strokeWidth="1.5" fill="none" style={{ animationDelay: ".4s" }} />
        <path className="ebb-curve" d="M820 240 C 1000 270, 1080 420, 1280 470" stroke="url(#ebb-grad)" strokeWidth="1.5" fill="none" style={{ animationDelay: ".8s" }} />
        <line x1="0" y1="520" x2="1400" y2="520" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 6" />
      </svg>

      <div className="container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div className="hero-inner-responsive" style={{ display: "grid", gridTemplateColumns: "55fr 45fr", gap: 40, alignItems: "center", transform: "translateY(-32px)" }}>

          {/* Left — text */}
          <div className="hero-left-order" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 620 }}>
            <div className="eyebrow" style={{ textAlign: "left" }}>
              <span className="eyebrow-dot" />
              <span>{t('eyebrow')}</span>
            </div>

            <h1 className="hero-h1" style={{ margin: 0, fontSize: "clamp(40px, 6.4vw, 78px)", fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 0.96 }}>
              <span>{t('title')}</span>
              <br />
              <span className="dim">{t('titleAccent')}</span>
            </h1>

            <p className="lede">
              {t('description')}
            </p>

            <div className="hero-ctas" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="btn btn-primary hero-cta-primary">{t('cta')}</Link>
            </div>

            <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>
              {t('note')}
            </div>
          </div>

          {/* Right — mockup */}
          <div
            className="hero-right-order hero-right-height"
            style={{ position: "relative", height: 540 }}
          >
            <MockupWindow />
          </div>
        </div>
      </div>

      <style>{`

        .ebb-curve {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          animation: ebb-draw 2.6s cubic-bezier(.2,.7,.3,1) .2s forwards;
        }
        @keyframes ebb-draw { to { stroke-dashoffset: 0; } }

        /* ── Tablet 768-1023px: 1-column, text above mockup ─── */
        @media (max-width: 1023px) {
          .hero-inner-responsive {
            grid-template-columns: 1fr !important;
            transform: none !important;
            gap: 32px !important;
          }
          .hero-left-order  { order: 1; }
          .hero-right-order { order: 2; }
          .hero-right-height { height: 400px !important; }
        }

        /* ── Mobile <768px: full overrides ─────────────── */
        @media (max-width: 767px) {
          .hero-ebb { display: none; }

          .hero-inner-responsive { gap: 20px !important; }

          /* Text above mockup on mobile */
          .hero-left-order  { order: 1 !important; }
          .hero-right-order { order: 2 !important; }

          .hero-right-height {
            height: 42vh !important;
            max-height: 280px;
            min-height: 180px;
          }

          /* H1: smaller, better line-height for 4-line wrap */
          .hero-h1 {
            font-size: 40px !important;
            letter-spacing: -0.02em !important;
            line-height: 1.05 !important;
          }

          /* Lede */
          .hero-left-order .lede {
            font-size: 16px;
          }

          /* CTAs: full-width on mobile */
          .hero-cta-primary {
            width: 100%;
            justify-content: center;
            padding: 16px 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
