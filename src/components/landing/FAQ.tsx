"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "@phosphor-icons/react";

const ITEMS = [
  { q: "C'est différent d'Anki ou de Quizlet ?", a: "Anki ne génère rien — tu écris tes cartes à la main. Quizlet fait des QCM basiques. Studra prend ton cours et génère flashcards, fiches, schémas, examens et dialogues socratiques, le tout connecté au même algorithme de répétition espacée." },
  { q: "L'IA peut se tromper sur les flashcards générées ?", a: "Oui, ça arrive. Chaque carte est éditable en un clic. On affiche un score de confiance quand la génération hésite, et tu peux corriger ou supprimer en deux secondes." },
  { q: "Mes cours sont confidentiels ?", a: "Tes cours te restent. On ne les utilise pas pour entraîner de modèle. Les fichiers sont chiffrés, hébergés en Europe, et tu peux tout supprimer depuis ton compte." },
  { q: "Ça marche pour quelles matières ?", a: "Toutes les matières textuelles fonctionnent très bien — histoire, philo, SVT, langues, droit, médecine. Pour les maths et la physique, les flashcards et les fiches sont solides ; les schémas conceptuels marchent moins bien sur des démonstrations longues." },
  { q: "Combien de temps avant de voir un effet ?", a: "Dès la première semaine, tu remarques ce que tu retiens vraiment et ce que tu pensais retenir. L'effet sur la mémoire long terme est mesurable après deux à trois semaines de sessions régulières." },
  { q: "Je peux annuler Pro à tout moment ?", a: "Oui, en un clic depuis les paramètres. Pas de période d'engagement. Tu gardes Pro jusqu'à la fin du mois en cours, puis tu repasses sur Free sans rien perdre." },
  { q: "Vous avez un essai gratuit ?", a: "Le plan Free n'est pas une démo limitée dans le temps : il reste gratuit. Pour tester Pro, on rembourse les 14 premiers jours si ça ne te convient pas." },
  { q: "Studra remplace mon prof ?", a: "Non." },
];

function FAQItem({ item, open, onToggle }: { item: typeof ITEMS[0]; open: boolean; onToggle: () => void }) {
  return (
    <li style={{ borderBottom: "1px solid var(--ink-200)" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          appearance: "none", border: 0, background: "transparent",
          width: "100%", padding: "22px 4px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
          font: "inherit", fontSize: 17.5, fontWeight: 500, letterSpacing: "-.015em",
          color: "var(--ink)", cursor: "pointer", textAlign: "left",
        }}
      >
        <span>{item.q}</span>
        <span style={{ color: "var(--ink-400)", flexShrink: 0, display: "inline-flex" }}>
          {open ? <Minus size={18} weight="regular" /> : <Plus size={18} weight="regular" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.3, 0.7, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 4px 22px", fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: "60ch" }}>
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number>(0);
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section className="sec" id="faq">
      <div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 48 }}
        >
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>Questions fréquentes</span>
          </div>
          <h2 className="section-h">
            Tout ce qu&apos;on te demande<br />
            <span className="dim">avant de s&apos;inscrire.</span>
          </h2>
        </motion.div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {ITEMS.map((it, i) => (
            <FAQItem key={i} item={it} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </ul>
      </div>
    </section>
  );
}
