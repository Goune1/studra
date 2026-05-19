"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  { n: "01", title: "Choisis ton outil.", body: "Flashcards, fiche, schéma, frise, examen blanc, dialogue socratique. Tout sort du même cours." },
  { n: "02", title: "Colle ton cours.", body: "Texte, PDF, image ou lien YouTube. Studra lit, structure, comprend." },
  { n: "03", title: "Révise sans réfléchir.", body: "L'algorithme te dit quoi réviser et quand. Tu ouvres l'app, tu fais ce qui apparaît." },
];

function Step({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
      style={{ position: "relative", paddingTop: 64 }}
    >
      <div className="mono" style={{ position: "absolute", top: -28, left: -8, fontSize: "clamp(120px, 14vw, 180px)", lineHeight: 1, fontWeight: 500, color: "rgba(228,228,231,.85)", letterSpacing: "-.06em", pointerEvents: "none", userSelect: "none" }}>
        {step.n}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.025em", color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>{step.title}</div>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: "36ch" }}>{step.body}</p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section className="sec" id="methode-bref">
      <div className="container">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 80, maxWidth: 720 }}
        >
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>Comment ça marche</span>
          </div>
          <h2 className="section-h">
            Trois étapes.<br />
            <span className="dim">Pas plus.</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }} className="hiw-grid-responsive">
          {STEPS.map((s, i) => <Step key={s.n} step={s} index={i} />)}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hiw-grid-responsive {
            grid-auto-flow: column !important;
            grid-template-columns: none !important;
            grid-auto-columns: 80% !important;
            gap: 24px !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            margin: 0 -20px;
            padding: 0 20px 16px;
            scrollbar-width: none;
          }
          .hiw-grid-responsive::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  );
}
