import {useFormatter, useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

type Plan = {
  name: string
  price: number
  desc: string
  cta: string
  ctaStyle: string
  href: '/register'
  features: string[]
  recommended?: boolean
  query?: {plan: string}
}

function PlanCard({plan}: {plan: Plan}) {
  const t = useTranslations('landing.pricing')
  const format = useFormatter()
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
          {t('recommended')}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 52, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1, color: "var(--ink)", fontFeatureSettings: "'tnum'" }}>{format.number(plan.price, {style: 'currency', currency: 'EUR'})}</span>
          <span style={{ color: "var(--ink-500)", fontSize: 16, fontWeight: 400 }}>{t('perMonth')}</span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--ink-700)", maxWidth: "36ch" }}>{plan.desc}</p>
      </div>

      <Link href={{pathname: plan.href, query: plan.query}} className={`btn ${plan.ctaStyle}`} style={{ width: "100%", padding: "14px 20px", justifyContent: "center" }}>{plan.cta}</Link>

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
  const t = useTranslations('landing.pricing')
  const free: Plan = {
    name: t('free.name'), price: 0, desc: t('free.description'), cta: t('free.cta'), ctaStyle: 'btn-outline', href: '/register',
    features: (['generations', 'tools', 'imports', 'spacing', 'socrate', 'planning'] as const).map((key) => t(`free.features.${key}`)),
  }
  const pro: Plan = {
    name: t('pro.name'), price: 4.99, desc: t('pro.description'), cta: t('pro.cta'), ctaStyle: 'btn-primary', href: '/register', query: {plan: 'pro'}, recommended: true,
    features: (['free', 'generations', 'youtube', 'gaps', 'annales', 'planning', 'socrate'] as const).map((key) => t(`pro.features.${key}`)),
  }

  return (
    <section className="sec" id="tarifs">
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 56, maxWidth: 760 }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>{t('eyebrow')}</span>
          </div>
          <h2 className="section-h">
            {t('title')}<br />
            <span className="dim">{t('titleAccent')}</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }} className="plans-grid-responsive">
          <PlanCard plan={free} />
          <PlanCard plan={pro} />
        </div>

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-500)" }}>
          {t('generationNote')}<br />
          {t('usageNote')}
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
