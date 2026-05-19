"use client";

import { useEffect, useState } from "react";

const CARDS = [
  "Quels sont les états généraux ?",
  "Date de la prise de la Bastille ?",
  "Qui était le ministre des finances en 1789 ?",
  "Qu'est-ce que le tiers état ?",
  "Pourquoi convoquer les états généraux ?",
  "Qu'apporte la nuit du 4 août 1789 ?",
];

interface Props { active: boolean }

export default function SceneGenerate({ active }: Props) {
  const [revealed, setRevealed] = useState(CARDS.map(() => false));

  useEffect(() => {
    if (!active) { setRevealed(CARDS.map(() => false)); return; }
    const ts = CARDS.map((_, i) =>
      setTimeout(() => {
        setRevealed((prev) => { const n = [...prev]; n[i] = true; return n; });
      }, 700 + i * 380)
    );
    return () => ts.forEach(clearTimeout);
  }, [active]);

  return (
    <>
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 3 }}>Génération</div>
        <div className="gen-scene-title" style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>22 cartes — Révolution française</div>
      </div>

      {/*
        Desktop: 3×2 grid (6 cards)
        Mobile <768px: 2×2 grid (4 cards), cards 5+6 hidden via CSS
      */}
      <div className="gen-grid-resp" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 8 }}>
        {CARDS.map((q, i) => (
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
                <div className="mono" style={{ fontSize: 8.5, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 999, alignSelf: "flex-start", textTransform: "uppercase", letterSpacing: ".1em" }}>Histoire</div>
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
