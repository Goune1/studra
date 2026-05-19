"use client";

import { useEffect, useState } from "react";
import { FileText, YoutubeLogo, ArrowRight } from "@phosphor-icons/react";
import Cursor from "./Cursor";

const FULL_TEXT =
  "Chapitre 3 — La Révolution française.\nLes causes profondes de la crise prérévolutionnaire sont à la fois économiques, sociales et politiques. La dette de l'État, le poids des impôts indirects et les mauvaises récoltes des années 1788-1789 alimentent un mécontentement généralisé...";

interface Props { active: boolean }

export default function SceneImport({ active }: Props) {
  const [typed, setTyped] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: -30, y: 50 });
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (!active) { setTyped(""); setCursorPos({ x: -30, y: 50 }); setClicking(false); return; }
    let intervalId: ReturnType<typeof setInterval>;
    const t1 = setTimeout(() => setCursorPos({ x: 40, y: 60 }), 200);
    const t2 = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i += 3;
        setTyped(FULL_TEXT.slice(0, i));
        if (i >= FULL_TEXT.length) clearInterval(intervalId);
      }, 35);
    }, 900);
    const t3 = setTimeout(() => setCursorPos({ x: 78, y: 86 }), 3700);
    const t4 = setTimeout(() => setClicking(true), 4100);
    const t5 = setTimeout(() => setClicking(false), 4300);
    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      clearInterval(intervalId);
    };
  }, [active]);

  return (
    <>
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 3 }}>Import</div>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>Coller un cours</div>
      </div>

      {/* Toolbar pills — hidden on mobile to save vertical space */}
      <div className="import-toolbar-resp" style={{ display: "flex", gap: 6, marginBottom: 10, flexShrink: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, padding: "4px 9px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 500 }}>
          <FileText size={11} weight="regular" /> Texte
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, padding: "4px 9px", borderRadius: 999, background: "rgba(0,0,0,.04)", color: "var(--ink-700)" }}>
          <FileText size={11} weight="regular" /> PDF
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, padding: "4px 9px", borderRadius: 999, background: "rgba(0,0,0,.04)", color: "var(--ink-700)" }}>
          <YoutubeLogo size={11} weight="regular" /> YouTube
        </span>
      </div>

      {/* Textarea — minHeight reduced on mobile */}
      <div className="import-textarea-resp" style={{ flex: 1, background: "#FAFAF9", border: "1px solid rgba(0,0,0,.06)", borderRadius: 8, padding: 12, minHeight: 110, overflow: "hidden" }}>
        <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.55, color: "var(--ink-700)" }}>
          {typed}<span className="caret" style={{ height: "12px", background: "var(--ink)" }} />
        </pre>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-400)" }}>{typed.length} caractères</span>
        <button style={{
          appearance: "none", border: 0, cursor: "default",
          background: clicking ? "#174038" : "var(--accent)",
          color: "var(--accent-fg)",
          fontFamily: "inherit", fontSize: 12, fontWeight: 500,
          padding: "7px 12px", borderRadius: 7,
          display: "inline-flex", alignItems: "center", gap: 6,
          transform: clicking ? "scale(.96)" : "scale(1)",
          transition: "transform .12s, background .15s",
        }}>
          Générer <ArrowRight size={12} />
        </button>
      </div>

      <Cursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />

      <style>{`
        @media (max-width: 767px) {
          .import-toolbar-resp { display: none !important; }
          .import-textarea-resp { min-height: 50px !important; flex: 1; }
        }
      `}</style>
    </>
  );
}
