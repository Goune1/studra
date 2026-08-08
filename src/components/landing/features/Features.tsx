"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
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
  { key: 'flashcards', span: 2, Anim: AnimFlashcards },
  { key: 'socrate', span: 1, Anim: AnimSocrate },
  { key: 'fiches', span: 1, Anim: AnimFiches },
  { key: 'schemas', span: 1, Anim: AnimSchemas },
  { key: 'exams', span: 1, Anim: AnimExam },
  { key: 'planning', span: 2, Anim: AnimPlanning },
  { key: 'recall', span: 1, Anim: AnimRappel },
] as const;

function BentoCard({ card, index }: { card: (typeof CARDS)[number]; index: number }) {
  const t = useTranslations('landing.features')
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const {key, span, Anim} = card;

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
      <CardHeader label={t(`cards.${key}.label`)} title={t(`cards.${key}.title`)} body={t(`cards.${key}.body`)} />
      <Anim />
    </motion.div>
  );
}

export default function Features() {
  const t = useTranslations('landing.features')
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
            <span>{t('eyebrow')}</span>
          </div>
          <h2 className="section-h">
            {t('title')}<br />
            <span className="dim">{t('titleAccent')}</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="bento-grid-responsive">
          {CARDS.map((card, i) => <BentoCard key={card.key} card={card} index={i} />)}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <Link href="/blog" className="btn btn-outline">
            {t('guides')} <ArrowRight size={14} />
          </Link>
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
