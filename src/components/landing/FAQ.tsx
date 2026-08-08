import { FAQ_ITEMS } from "./faq-data";
import {useTranslations} from 'next-intl'

export default function FAQ() {
  const t = useTranslations('landing.faq')
  return (
    <section className="sec" id="faq">
      <div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 48 }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>{t('eyebrow')}</span>
          </div>
          <h2 className="section-h">
            {t('title')}<br />
            <span className="dim">{t('titleAccent')}</span>
          </h2>
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {FAQ_ITEMS.map((item, index) => (
            <li key={item.questionKey} style={{ borderBottom: "1px solid var(--ink-200)" }}>
              <details className="faq-native" open={index === 0}>
                <summary style={{ width: "100%", padding: "22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontSize: 17.5, fontWeight: 500, letterSpacing: "-.015em", color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>
                  <span>{t(item.questionKey)}</span>
                  <span className="faq-symbol" aria-hidden="true" />
                </summary>
                <div style={{ padding: "0 4px 22px", fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: "60ch" }}>
                  {t(item.answerKey)}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .faq-native summary { list-style: none; }
        .faq-native summary::-webkit-details-marker { display: none; }
        .faq-symbol {
          color: var(--ink-400);
          flex-shrink: 0;
          font-size: 22px;
          font-weight: 400;
          line-height: 1;
        }
        .faq-symbol::before { content: "+"; }
        .faq-native[open] .faq-symbol::before { content: "−"; }
      `}</style>
    </section>
  );
}
