"use client";

import { useEffect, useState } from "react";
import {useTranslations} from 'next-intl'

const TARGET = 247;

export default function AnimRappel() {
  const t = useTranslations('landing.animations.recall')
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf: number;
    let cycle: ReturnType<typeof setTimeout>;

    const tick = (start: number, ts: number) => {
      const dt = ts - start;
      if (dt < 3200) {
        setN(Math.floor((dt / 3200) * TARGET));
        raf = requestAnimationFrame((t) => tick(start, t));
      } else {
        setN(TARGET);
        cycle = setTimeout(() => {
          setN(0);
          raf = requestAnimationFrame((t) => tick(t, t));
        }, 1400);
      }
    };
    raf = requestAnimationFrame((t) => tick(t, t));
    return () => { cancelAnimationFrame(raf); clearTimeout(cycle); };
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ flex: 1, background: "#FAFAF9", border: "1px solid rgba(0,0,0,.06)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
        {[t('line1'), t('line2'), t('line3'), t('line4')].map((line, i, arr) => (
          <div key={i} style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--ink-700)" }}>
            {line}{i === arr.length - 1 && <span className="caret" style={{ height: "1em", background: "currentColor" }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{t('wordCount', {count: n})}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-400)" }}>{t('submit')}</span>
      </div>
    </div>
  );
}
