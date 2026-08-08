"use client";

import { useEffect, useState } from "react";
import {useTranslations} from 'next-intl'

const CARD_KEYS = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'] as const

interface Props { active: boolean }

export default function SceneGenerate({ active }: Props) {
  const t = useTranslations('landing.animations.hero')
  const cards = CARD_KEYS.map((key) => t(key))
  const [revealed, setRevealed] = useState(CARD_KEYS.map(() => false));

  useEffect(() => {
    // Timer-driven animation (external system): reset choreography state when inactive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active) { setRevealed(CARD_KEYS.map(() => false)); return; }
    const ts = CARD_KEYS.map((_, i) =>
      setTimeout(() => {
        setRevealed((prev) => { const n = [...prev]; n[i] = true; return n; });
      }, 700 + i * 380)
    );
    return () => ts.forEach(clearTimeout);
  }, [active]);

  return (
    <>
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 3 }}>{t('generateTitle')}</div>
        <div className="gen-scene-title" style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>{t('generatedCards', {count: 22})}</div>
      </div>

      {/*
        Desktop: 3×2 grid (6 cards)
        Mobile <768px: 2×2 grid (4 cards), cards 5+6 hidden via CSS
      */}
      <div className="gen-grid-resp" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 8 }}>
        {cards.map((q, i) => (
          <div key={i} className="gen-card-resp" style={{
            background: "#FFF",
            border: "1px solid rgba(0,0,0,.07)",
            borderRadius: 8,
            padding: 10,
            display: "flex", flexDirection: "column", gap: 5,
            opacity: revealed[i] ? 1 : 0,
            transform: revealed[i] ? "scale(1) translateY(0)" : "scale(.94) translateY(6px)",
            transition: "opacity .35s ease, transform .55s cubic-bezier(.34,1.56,.64,1)",
            overflow: "hidden",
          }}>
            {!revealed[i] ? (
              <>
                <div className="skeleton" style={{ height: 7, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 7, borderRadius: 4, width: "60%" }} />
              </>
            ) : (
              <>
                <div className="mono" style={{ fontSize: 9, color: "var(--ink-400)", letterSpacing: ".1em" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 11, lineHeight: 1.35, color: "var(--ink)", fontWeight: 450, flex: 1 }}>{q}</div>
                <div className="mono" style={{ fontSize: 8.5, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 999, alignSelf: "flex-start", textTransform: "uppercase", letterSpacing: ".1em" }}>{t('history')}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .gen-grid-resp {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: repeat(2, 1fr) !important;
          }
          /* Hide 5th and 6th card on mobile — 2×2 is enough */
          .gen-card-resp:nth-child(n+5) { display: none !important; }
          .gen-scene-title { font-size: 13px !important; }
        }
      `}</style>
    </>
  );
}
