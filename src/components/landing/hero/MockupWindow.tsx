"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import SceneImport from "./scenes/SceneImport";
import SceneGenerate from "./scenes/SceneGenerate";
import SceneReview from "./scenes/SceneReview";
import ScenePlanning from "./scenes/ScenePlanning";

const SCENE_LABELS = ["Import", "Decks", "Révision", "Fiches", "Schémas", "Planning", "Examens"];
const SCENE_ACTIVE = [0, 1, 2, -1, -1, 3, -1];
const DURATIONS = [4500, 5000, 5000, 4500];

export default function MockupWindow() {
  const [scene, setScene] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Legitimate external sync: read the media query and subscribe to changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    // Timer-driven scene animation (external system); reduced-motion pins a single scene.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduced) { setScene(2); return; }
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      i = (i + 1) % 4;
      setScene(i);
      t = setTimeout(tick, DURATIONS[i]);
    };
    t = setTimeout(tick, DURATIONS[0]);
    return () => clearTimeout(t);
  }, [reduced]);

  const SCENES = [
    <SceneImport key="import" active={scene === 0} />,
    <SceneGenerate key="generate" active={scene === 1} />,
    <SceneReview key="review" active={scene === 2} />,
    <ScenePlanning key="planning" active={scene === 3} />,
  ];

  return (
    /* Outer: absolute-fill with 3D perspective. Mobile: inset 0, no perspective. */
    <div
      className="mock-outer-wrap"
      style={{
        position: "absolute",
        top: 0, bottom: 0,
        left: -20, right: -120,
        perspective: 1800,
        perspectiveOrigin: "30% 50%",
      }}
    >
      {/* Inner chrome: 3D-rotated on desktop, flat on mobile */}
      <div
        className="mock-3d-chrome"
        style={{
          position: "absolute", inset: 0,
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,.06)",
          boxShadow:
            "0 0 0 .5px rgba(0,0,0,.04), 0 30px 60px -20px rgba(0,0,0,.18), 0 80px 120px -40px rgba(0,0,0,.20)",
          overflow: "hidden",
          transform: "rotateY(-3deg) rotateX(2deg)",
          transformOrigin: "30% 50%",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Topbar */}
        <div style={{
          display: "grid", gridTemplateColumns: "80px 1fr 80px",
          alignItems: "center", height: 36, padding: "0 14px",
          borderBottom: "1px solid rgba(0,0,0,.05)",
          background: "#FCFCFB",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#E4E4E7", display: "inline-block" }} />
            ))}
          </div>
          <div style={{ justifySelf: "center", background: "rgba(0,0,0,.04)", padding: "3px 10px", borderRadius: 6, fontSize: 11, color: "var(--ink-700)", display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 200 }} className="mono">
            <span style={{ fontSize: 9, opacity: 0.55 }}>⌁</span>
            <span>studra.fr/app</span>
          </div>
          {/* Right buttons — hidden on mobile */}
          <div className="mock-topbar-actions" style={{ display: "flex", gap: 6, justifySelf: "end" }}>
            {[0, 1].map(i => (
              <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(0,0,0,.06)", display: "inline-block" }} />
            ))}
          </div>
        </div>

        {/* Body: sidebar (hidden on mobile) + canvas */}
        <div
          className="mock-body-responsive"
          style={{ flex: 1, display: "grid", gridTemplateColumns: "156px 1fr", minHeight: 0 }}
        >
          {/* Sidebar — hidden on mobile */}
          <aside
            className="mock-sidebar-desktop"
            style={{ background: "#FAFAF9", borderRight: "1px solid rgba(0,0,0,.05)", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", fontSize: 13 }}>
              <Image src="/studra-logo.png" alt="" width={18} height={18} />
              <span style={{ fontWeight: 600, letterSpacing: "-.02em" }}>Studra</span>
            </div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", padding: "8px 6px 2px" }}>Espace</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              {SCENE_LABELS.map((label, idx) => {
                const active = SCENE_ACTIVE[idx] === scene;
                return (
                  <li key={label} style={{
                    fontSize: 12, padding: "6px 8px", borderRadius: 6,
                    color: active ? "var(--ink)" : "var(--ink-700)",
                    background: active ? "rgba(0,0,0,.05)" : "transparent",
                    fontWeight: active ? 500 : 400,
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background .25s",
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "var(--accent)" : "var(--ink-400)", flexShrink: 0, display: "inline-block" }} />
                    {label}
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Canvas */}
          <div style={{ position: "relative", overflow: "hidden", background: "#FFFFFF" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={scene}
                className="mock-canvas-pad"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] as [number, number, number, number] }}
                style={{ position: "absolute", inset: 0, padding: "20px 22px", display: "flex", flexDirection: "column" }}
              >
                {SCENES[scene]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        /* Tablet 768-1023px: slight reduction, keep 3D */
        @media (max-width: 1023px) and (min-width: 768px) {
          .mock-outer-wrap { left: 0 !important; right: -24px !important; }
        }

        /* Laptop 1024-1439px: contained, no viewport overflow */
        @media (min-width: 1024px) and (max-width: 1439px) {
          .mock-outer-wrap { left: -8px !important; right: 0 !important; }
        }

        /* Large desktop 1440-1919px: subtle overflow */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .mock-outer-wrap { left: -16px !important; right: -32px !important; }
        }

        /* Full HD+ 1920px+: full design overflow */
        @media (min-width: 1920px) {
          .mock-outer-wrap { left: -20px !important; right: -120px !important; }
        }

        /* Mobile <768px: flat, no overflow, no sidebar */
        @media (max-width: 767px) {
          .mock-outer-wrap {
            left: 0 !important;
            right: 0 !important;
            perspective: none !important;
          }
          .mock-3d-chrome {
            transform: none !important;
            transform-origin: center !important;
            box-shadow: 0 4px 20px -6px rgba(0,0,0,.14) !important;
            border-radius: 12px !important;
          }
          .mock-topbar-actions { display: none !important; }
          .mock-sidebar-desktop { display: none !important; }
          .mock-body-responsive { grid-template-columns: 1fr !important; }
          .mock-canvas-pad { padding: 14px 16px !important; }
        }
      `}</style>
    </div>
  );
}
