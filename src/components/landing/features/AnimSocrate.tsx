"use client";

import { useEffect, useState } from "react";

const QUESTIONS = [
  "Tu peux me redéfinir ce qu'est une fonction affine sans tes notes ?",
  "Pourquoi 1789 marque la fin de l'Ancien Régime, concrètement ?",
  "Donne-moi un exemple où la mitose se déclenche dans le corps.",
];

type Phase = "typing" | "hold" | "erasing";

export default function AnimSocrate() {
  const [qi, setQi] = useState(0);
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    const target = QUESTIONS[qi];
    let id: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      let i = shown.length;
      id = setInterval(() => {
        i += 1;
        setShown(target.slice(0, i));
        if (i >= target.length) {
          clearInterval(id as ReturnType<typeof setInterval>);
          id = setTimeout(() => setPhase("hold"), 0);
        }
      }, 28);
    } else if (phase === "hold") {
      id = setTimeout(() => setPhase("erasing"), 2200);
    } else {
      let i = shown.length;
      id = setInterval(() => {
        i -= 2;
        setShown(target.slice(0, Math.max(0, i)));
        if (i <= 0) {
          clearInterval(id as ReturnType<typeof setInterval>);
          setQi((q) => (q + 1) % QUESTIONS.length);
          setPhase("typing");
        }
      }, 18);
    }
    return () => { clearInterval(id as ReturnType<typeof setInterval>); clearTimeout(id as ReturnType<typeof setTimeout>); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qi]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end", padding: "0 0 4px" }}>
      {/* AI message */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-fg)", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>S</span>
        <div style={{ background: "#FAFAF9", border: "1px solid rgba(0,0,0,.06)", borderRadius: "14px 14px 14px 4px", padding: "10px 12px", fontSize: 13, lineHeight: 1.4, color: "var(--ink)", maxWidth: "86%" }}>
          {shown}<span className="caret" style={{ height: "1em", background: "currentColor" }} />
        </div>
      </div>
      {/* User skeleton */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", justifyContent: "flex-end" }}>
        <div style={{ background: "var(--ink)", borderRadius: "14px 14px 4px 14px", padding: "12px 14px", minWidth: "60%", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ height: 7, borderRadius: 3, background: "linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.2), rgba(255,255,255,.08))", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite", display: "block", width: "80%" }} />
          <span style={{ height: 7, borderRadius: 3, background: "linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.2), rgba(255,255,255,.08))", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite", display: "block", width: "50%" }} />
        </div>
      </div>
    </div>
  );
}
