"use client";

import { useEffect, useState } from "react";
import {useTranslations} from 'next-intl'

export default function AnimFlashcards() {
  const t = useTranslations('landing.animations.flashcards')
  const cards = [
    {q: t('pythagoras'), cat: t('math')},
    {q: t('war'), cat: t('history')},
    {q: t('acid'), cat: t('chemistry')},
  ]
  const [top, setTop] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTop((t) => (t + 1) % 3), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px 8px" }}>
      {cards.map((c, i) => {
        const pos = (i - top + 3) % 3;
        return (
          <div key={i} style={{
            position: "absolute",
            width: "min(280px, 86%)",
            aspectRatio: "16/10",
            background: "#FAFAF9",
            border: "1px solid rgba(0,0,0,.08)",
            borderRadius: 14,
            padding: 16,
            display: "flex", flexDirection: "column", gap: 6,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,.15)",
            transform: `translate(${pos * -8}px, ${pos * 10}px) rotate(${(pos - 1) * 2.5}deg) scale(${1 - pos * 0.04})`,
            zIndex: 10 - pos,
            opacity: 1 - pos * 0.18,
            transition: "transform .9s cubic-bezier(.34,1.3,.45,1), opacity .9s",
          }}>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".14em" }}>{c.cat}</div>
            <div style={{ fontSize: 15, fontWeight: 450, lineHeight: 1.3, color: "var(--ink)", flex: 1, letterSpacing: "-.01em" }}>{c.q}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="mono" style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, background: "rgba(0,0,0,.05)", color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".1em" }}>{t('due')}</span>
              <span className="mono" style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".1em" }}>{t('rating')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
