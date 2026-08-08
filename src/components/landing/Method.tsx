import {useTranslations} from 'next-intl'

export default function Method() {
  const t = useTranslations('landing.method')
  const blocks = (['spacing', 'recall', 'socrate'] as const).map((key) => ({
    key,
    title: t(`blocks.${key}.title`),
    body: t(`blocks.${key}.body`),
  }))

  return (
    <section id="methode" style={{ padding: "120px 0 100px" }}>
      <div className="container method-grid-responsive" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 40, alignItems: "start" }}>
        <div style={{ position: "sticky", top: 120, height: "100%", display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }} className="method-rail-responsive">
          <div className="mono method-vertical-responsive" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 13, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--ink-400)", whiteSpace: "nowrap" }}>
            {t('eyebrow')}
          </div>
        </div>

        <div style={{ maxWidth: "64ch" }}>
          {blocks.map((block, i) => (
            <div key={block.key}>
              {i > 0 && <div style={{ height: 1, background: "var(--ink-200)", width: "60%", margin: "32px 0" }} />}
              <div style={{ padding: "8px 0" }}>
                <h3 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.2, margin: "0 0 16px", color: "var(--ink)", textWrap: "balance" }}>{block.title}</h3>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "var(--ink-700)" }}>{block.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .method-grid-responsive { display: grid; }
        @media (max-width: 900px) {
          .method-grid-responsive { grid-template-columns: 1fr !important; gap: 24px !important; }
          .method-rail-responsive { position: relative !important; top: 0 !important; }
          .method-vertical-responsive { writing-mode: horizontal-tb !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
