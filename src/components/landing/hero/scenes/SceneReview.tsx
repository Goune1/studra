"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import Cursor from "./Cursor";

interface Props { active: boolean }

export default function SceneReview({ active }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 70 });
  const [clicking, setClicking] = useState(false);
  const [badge, setBadge] = useState(false);

  useEffect(() => {
    // Timer-driven animation (external system): reset choreography state when inactive.
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlipped(false); setShowButtons(false); setBadge(false);
      setCursorPos({ x: 50, y: 70 });
      return;
    }
    const ts = [
      setTimeout(() => setFlipped(true), 1100),
      setTimeout(() => setShowButtons(true), 2100),
      setTimeout(() => setCursorPos({ x: 52, y: 88 }), 2600),
      setTimeout(() => setClicking(true), 3300),
      setTimeout(() => { setClicking(false); setBadge(true); }, 3500),
      setTimeout(() => setBadge(false), 4900),
    ];
    return () => ts.forEach(clearTimeout);
  }, [active]);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 4 }}>Révision · 03 / 22</div>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>Rappel actif</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center", gap: 14, position: "relative" }}>
        {/* Flip card */}
        <div style={{ width: "78%", maxWidth: 320, margin: "0 auto", aspectRatio: "16/9", perspective: 1000, position: "relative" }}>
          {/* Front */}
          <div style={{
            position: "absolute", inset: 0,
            background: "#FAFAF9",
            border: "1px solid rgba(0,0,0,.07)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 6,
            boxShadow: "0 6px 20px -8px rgba(0,0,0,.12)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            transition: "transform .9s cubic-bezier(.6,.05,.2,.95)",
            transform: flipped ? "rotateY(-180deg)" : "rotateY(0deg)",
          }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent)" }}>Question</div>
            <div style={{ fontSize: 14, lineHeight: 1.35, color: "var(--ink)", fontWeight: 450, flex: 1 }}>Date de la prise de la Bastille ?</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--ink-400)", letterSpacing: ".1em" }}>Espace · Retourner</div>
          </div>
          {/* Back */}
          <div style={{
            position: "absolute", inset: 0,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,.07)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 6,
            boxShadow: "0 6px 20px -8px rgba(0,0,0,.12)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            transition: "transform .9s cubic-bezier(.6,.05,.2,.95)",
            transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
          }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent)" }}>Réponse</div>
            <div style={{ fontSize: 14, lineHeight: 1.35, color: "var(--ink)", flex: 1 }}>
              <strong style={{ fontWeight: 600 }}>14 juillet 1789.</strong> Prise par les insurgés parisiens, symbole de la fin de l'absolutisme.
            </div>
            <div className="mono" style={{ fontSize: 9, color: "var(--ink-400)", letterSpacing: ".1em" }}>Évalue ta réponse ↓</div>
          </div>
        </div>

        {/* Rating buttons */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
          opacity: showButtons ? 1 : 0,
          transform: showButtons ? "translateY(0)" : "translateY(8px)",
          transition: "opacity .4s, transform .5s cubic-bezier(.2,.7,.3,1)",
        }}>
          {[
            { label: "Encore", kbd: "1", color: "#B91C1C", bg: "rgba(185,28,28,.04)", border: "rgba(185,28,28,.15)" },
            { label: "Difficile", kbd: "2", color: "#C2410C", bg: "rgba(194,65,12,.04)", border: "rgba(194,65,12,.15)" },
            { label: "Bien", kbd: "3", color: "#15803D", bg: clicking ? "rgba(21,128,61,.12)" : "rgba(21,128,61,.04)", border: "rgba(21,128,61,.15)", pressing: clicking },
            { label: "Facile", kbd: "4", color: "#1D4ED8", bg: "rgba(29,78,216,.04)", border: "rgba(29,78,216,.15)" },
          ].map((btn) => (
            <button key={btn.label} style={{
              appearance: "none",
              border: `1px solid ${btn.border}`,
              cursor: "default",
              background: btn.bg,
              fontFamily: "inherit", fontSize: 10, fontWeight: 500,
              padding: "7px 6px", borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              color: btn.color,
              transform: btn.pressing ? "scale(.96)" : "scale(1)",
              transition: "transform .12s, background .15s",
            }}>
              {btn.label}
              <span className="mono" style={{ fontSize: 8.5, color: "var(--ink-400)" }}>{btn.kbd}</span>
            </button>
          ))}
        </div>

        {/* Badge */}
        {badge && (
          <div style={{
            position: "absolute", right: "8%", top: "30%",
            background: "var(--ink)", color: "#FFF",
            fontSize: 10.5, fontWeight: 500,
            padding: "6px 10px", borderRadius: 999,
            display: "inline-flex", alignItems: "center", gap: 6,
            boxShadow: "0 6px 20px -6px rgba(0,0,0,.3)",
            animation: "badge-pop .45s cubic-bezier(.34,1.6,.64,1) backwards",
          }}>
            <Clock size={11} weight="regular" />
            <span>Revoir dans 2 jours</span>
          </div>
        )}
      </div>

      <Cursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />

      <style>{`
        @keyframes badge-pop {
          0%   { opacity: 0; transform: scale(.6) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
