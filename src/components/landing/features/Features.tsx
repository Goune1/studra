"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import AnimFlashcards from "./AnimFlashcards";
import AnimSocrate from "./AnimSocrate";
import AnimFiches from "./AnimFiches";
import AnimSchemas from "./AnimSchemas";
import AnimExam from "./AnimExam";
import AnimPlanning from "./AnimPlanning";
import AnimRappel from "./AnimRappel";

function CardHeader({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-500)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.025em", color: "var(--ink)", lineHeight: 1.15 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-700)", maxWidth: "44ch" }}>{body}</p>
    </div>
  );
}

const CARDS = [
  { label: "Mémorisation", title: "Flashcards", body: "Espace les révisions au bon moment. Ce que tu commences à oublier revient en premier.", span: 2, row: 1, Anim: AnimFlashcards },
  { label: "Dialogue", title: "Mode Socrate", body: "Une IA qui pose les bonnes questions, jusqu'à ce que tu expliques vraiment.", span: 1, row: 1, Anim: AnimSocrate },
  { label: "Structure", title: "Fiches", body: "Un résumé propre, hiérarchisé, exportable. Pas un mur de surlignage.", span: 1, row: 2, Anim: AnimFiches },
  { label: "Visuel", title: "Schémas", body: "Concepts, liens, dépendances. Lisible d'un coup d'œil.", span: 1, row: 2, Anim: AnimSchemas },
  { label: "Évaluation", title: "Examens blancs", body: "Sujets adaptés, correction détaillée, note sur 20.", span: 1, row: 2, Anim: AnimExam },
  { label: "Organisation", title: "Planning", body: "L'algorithme décide quand. Toi, tu ouvres l'app et tu fais ce qui apparaît.", span: 2, row: 3, Anim: AnimPlanning },
  { label: "Rappel actif", title: "Rappel libre", body: "Écris tout ce que tu sais. Studra compare avec le cours et te montre les trous.", span: 1, row: 3, Anim: AnimRappel },
];

function BentoCard({ card, index }: { card: typeof CARDS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { label, title, body, span, Anim } = card;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.65, ease: [0.2, 0.7, 0.3, 1] }}
      style={{
        position: "relative",
        background: "var(--bg-elev)",
        border: "1px solid var(--line)",
        borderRadius: 28,
        padding: 32,
        minHeight: 340,
        display: "flex", flexDirection: "column", gap: 20,
        overflow: "hidden",
        gridColumn: span === 2 ? "span 2" : "span 1",
      }}
      className={span === 2 ? "bento-span2-responsive" : ""}
    >
      <CardHeader label={label} title={title} body={body} />
      <Anim />
    </motion.div>
  );
}

export default function Features() {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section className="sec" id="features">
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
            <span>Fonctionnalités</span>
          </div>
          <h2 className="section-h">
            Un cours.<br />
            <span className="dim">Sept manières de le réviser.</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="bento-grid-responsive">
          {CARDS.map((card, i) => <BentoCard key={card.title} card={card} index={i} />)}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <a href="#" className="btn btn-outline">
            Voir toutes les fonctionnalités <ArrowRight size={14} />
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .bento-grid-responsive { grid-template-columns: 1fr !important; }
          .bento-span2-responsive { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
}
