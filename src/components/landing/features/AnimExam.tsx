"use client";

import { useEffect, useState } from "react";
import {useTranslations} from 'next-intl'

export default function AnimExam() {
  const t = useTranslations('landing.animations.exam')
  const [pct, setPct] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  useEffect(() => {
    let raf: number;
    let cycle: ReturnType<typeof setTimeout>;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const dt = ts - start;
      if (dt < 3000) {
        setPct(Math.min(100, (dt / 3000) * 100));
        raf = requestAnimationFrame(tick);
      } else {
        setPct(100);
        setShowGrade(true);
        cycle = setTimeout(() => {
          setShowGrade(false); setPct(0); start = null;
          raf = requestAnimationFrame(tick);
        }, 1800);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(cycle); };
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: "8px 4px", justifyContent: "flex-end", position: "relative" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: ".14em" }}>{t('progress')}</div>
      <div style={{ background: "#FAFAF9", border: "1px solid rgba(0,0,0,.06)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, color: "var(--ink-700)", lineHeight: 1.4 }}>{t('prompt')}</div>
        <div style={{ fontSize: 12, color: "var(--ink-700)", lineHeight: 1.4 }}>{t('instruction')}</div>
      </div>
      <div style={{ height: 6, background: "rgba(0,0,0,.05)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--accent)", borderRadius: 999, width: `${pct}%`, transition: "width .1s linear" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-500)" }}>{t('time', {minutes: Math.floor(pct * 0.32)})}</span>
        {showGrade && (
          <div style={{ fontFamily: "var(--font-geist-mono), monospace", color: "var(--ink)", fontSize: 13, animation: "grade-pop .5s cubic-bezier(.34,1.6,.64,1)" }}>
            <strong style={{ fontSize: 28, fontWeight: 500, color: "var(--accent)", letterSpacing: "-.02em" }}>16.5</strong>
            <span style={{ color: "var(--ink-400)", fontSize: 14, marginLeft: 1 }}>/20</span>
          </div>
        )}
      </div>
      <style>{`@keyframes grade-pop { 0% { opacity: 0; transform: scale(.5); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
