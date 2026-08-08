import {useTranslations} from 'next-intl'

export default function AnimFiches() {
  const t = useTranslations('landing.animations.fiche')
  const rows = Array(2).fill(null);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ position: "relative", height: "100%", borderRadius: 10, background: "#FFFFFF", border: "1px solid rgba(0,0,0,.06)", overflow: "hidden", padding: 16 }}>
        <div style={{ animation: "ficheScroll 16s linear infinite", display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((_, n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.01em", marginTop: 8 }}>{t('title')}</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>{t('causes')}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{t('debtStart')} <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> {t('debtEnd')}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{t('harvestStart')} <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> {t('harvestEnd')}</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>{t('break')}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{t('estatesStart')} <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> {t('estatesEnd')}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{t('oathStart')} <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> {t('oathEnd')}</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>{t('august')}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{t('abolition')} <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} />.</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24, background: "linear-gradient(180deg, #fff, transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, background: "linear-gradient(0deg, #fff, transparent)", pointerEvents: "none" }} />
      </div>
      <style>{`@keyframes ficheScroll { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }`}</style>
    </div>
  );
}
