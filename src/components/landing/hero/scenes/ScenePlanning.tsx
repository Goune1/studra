"use client";

import { useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const SESSIONS = [
  [{ top: 10, h: 14, c: "green", done: true }, { top: 34, h: 10, c: "blue" }, { top: 62, h: 18, c: "orange" }],
  [{ top: 8, h: 10, c: "blue" }, { top: 36, h: 16, c: "green", done: true }],
  [{ top: 14, h: 18, c: "orange" }, { top: 42, h: 10, c: "green" }, { top: 64, h: 14, c: "blue" }],
  [{ top: 20, h: 12, c: "green" }],
  [{ top: 6, h: 14, c: "blue", done: true }, { top: 34, h: 10, c: "orange" }, { top: 60, h: 16, c: "green" }],
  [{ top: 18, h: 22, c: "green" }],
  [{ top: 30, h: 18, c: "blue" }],
] as { top: number; h: number; c: string; done?: boolean }[][];

const COLOR_MAP: Record<string, string> = {
  green:  "rgba(31,77,63,.85)",
  blue:   "rgba(29,78,216,.7)",
  orange: "rgba(194,65,12,.7)",
};

interface Props { active: boolean }

export default function ScenePlanning({ active }: Props) {
  const [reveal, setReveal] = useState<string[]>([]);

  useEffect(() => {
    // Timer-driven animation (external system): reset choreography state when inactive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active) { setReveal([]); return; }
    const all: [number, number][] = [];
    SESSIONS.forEach((day, di) => day.forEach((_, si) => all.push([di, si])));
    const ts = all.map(([di, si], idx) =>
      setTimeout(() => setReveal((prev) => [...prev, `${di}-${si}`]), 250 + idx * 95)
    );
    return () => ts.forEach(clearTimeout);
  }, [active]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 4 }}>Planning · semaine 15</div>
          <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>Sessions prévues</div>
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-400)" }}>4h 20 / 7h</div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {DAYS.map((d, di) => (
          <div key={d} style={{ display: "flex", flexDirection: "column", background: "#FAFAF9", borderRadius: 6, padding: "4px 4px 6px", overflow: "hidden" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-400)", textAlign: "center", padding: "2px 0 4px" }}>{d}</div>
            <div style={{ flex: 1, position: "relative", background: "rgba(0,0,0,.025)", borderRadius: 4 }}>
              {SESSIONS[di].map((s, si) => {
                const key = `${di}-${si}`;
                const on = reveal.includes(key);
                return (
                  <div key={si} style={{
                    position: "absolute", left: 2, right: 2,
                    top: `${s.top}%`, height: `${s.h}%`,
                    borderRadius: 3,
                    background: on ? COLOR_MAP[s.c] : "transparent",
                    opacity: on ? 1 : 0,
                    transform: on ? "scaleY(1)" : "scaleY(.5)",
                    transformOrigin: "top",
                    transition: "opacity .35s, transform .5s cubic-bezier(.2,.7,.3,1), background .3s",
                    display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 2,
                  }}>
                    {s.done && on && (
                      <span style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,.95)", color: "var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={9} weight="bold" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
