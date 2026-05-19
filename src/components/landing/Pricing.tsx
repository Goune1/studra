"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "@phosphor-icons/react";

const FREE = {
  name: "Free", price: "0", desc: "Pour tester et réviser une matière.",
  cta: "Commencer gratuitement", ctaStyle: "btn-outline",
  features: ["Import texte et PDF", "3 decks de flashcards", "Fiches illimitées", "Examens blancs · 2 par semaine", "Mode Socrate · limité", "Planning basique"],
};
const PRO = {
  name: "Pro", price: "5", desc: "Pour préparer un bac, un concours, un examen sérieux.",
  cta: "Passer à Pro", ctaStyle: "btn-primary", recommended: true,
  features: ["Tout le plan Free", "Flashcards illimitées", "Import YouTube et image", "Analyse des lacunes", "Annales adaptatives", "Planning avancé", "Examens blancs illimités", "Mode Socrate illimité"],
};

function PlanCard({ plan, index }: { plan: typeof FREE & { recommended?: boolean }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
      style={{
        position: "relative",
        background: "var(--bg-elev)",
        border: `1px solid ${plan.recommended ? "var(--accent)" : "var(--line)"}`,
        boxShadow: plan.recommended ? "0 0 0 1px var(--accent) inset" : "none",
        borderRadius: 24,
        padding: 40,
        display: "flex", flexDirection: "column", gap: 24,
      }}
    >
      {plan.recommended && (
        <div className="mono" style={{ position: "absolute", top: 18, right: 24, fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 500 }}>
          Recommandé
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 52, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1, color: "var(--ink)", fontFeatureSettings: "'tnum'" }}>{plan.price}</span>
          <span style={{ fontSize: 22, color: "var(--ink)", fontWeight: 500 }}>
            €<span style={{ color: "var(--ink-500)", fontSize: 16, fontWeight: 400 }}>/mois</span>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--ink-700)", maxWidth: "36ch" }}>{plan.desc}</p>
      </div>

      <a href="#" className={`btn ${plan.ctaStyle}`} style={{ width: "100%", padding: "14px 20px", justifyContent: "center" }}>{plan.cta}</a>

      <div style={{ height: 1, background: "var(--ink-200)" }} />

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, lineHeight: 1.45, color: "var(--ink-700)" }}>
            <span style={{ color: "var(--accent)", flexShrink: 0, display: "inline-flex", marginTop: 2 }}>
              <Check size={14} weight="regular" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Pricing() {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section className="sec" id="tarifs">
      <div className="container">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 56, maxWidth: 760 }}
        >
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>Tarifs</span>
          </div>
          <h2 className="section-h">
            Gratuit pour commencer.<br />
            <span className="dim">Pas cher pour aller au bout.</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }} className="plans-grid-responsive">
          <PlanCard plan={FREE} index={0} />
          <PlanCard plan={PRO} index={1} />
        </div>

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 13.5, color: "var(--ink-500)" }}>
          Annulable à tout moment. Pas d&apos;engagement.
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plans-grid-responsive { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .plans-grid-responsive > div { padding: 32px 28px !important; }
        }
      `}</style>
    </section>
  );
}
