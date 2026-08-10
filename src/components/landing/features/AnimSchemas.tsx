"use client";

import { useEffect, useState } from "react";
import {useTranslations} from 'next-intl'
const EDGES = [
  { from: "a", to: "b" }, { from: "a", to: "c" },
  { from: "b", to: "d" }, { from: "c", to: "e" },
  { from: "d", to: "e" },
];
const SEQUENCE = [["a"], ["b", "c"], ["d", "e"]];

export default function AnimSchemas() {
  const t = useTranslations('landing.animations.schemas')
  const nodes = [
    {id: 'a', x: 90, y: 30, label: t('revolution')},
    {id: 'b', x: 20, y: 90, label: t('causes')},
    {id: 'c', x: 160, y: 90, label: t('actors')},
    {id: 'd', x: 50, y: 160, label: t('crisis')},
    {id: 'e', x: 130, y: 160, label: '1789'},
  ]
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (SEQUENCE.length + 1)), 1100);
    return () => clearInterval(id);
  }, []);

  const active = new Set<string>();
  for (let i = 0; i <= step && i < SEQUENCE.length; i++) {
    SEQUENCE[i].forEach((id) => active.add(id));
  }

  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", maxHeight: 220 }}>
        {EDGES.map((e, i) => {
          const a = find(e.from), b = find(e.to);
          const lit = active.has(e.from) && active.has(e.to);
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={lit ? "var(--accent)" : "rgba(0,0,0,.12)"}
                  strokeWidth="1.5"
                  style={{ transition: "stroke .5s" }} />
          );
        })}
        {nodes.map((n) => {
          const on = active.has(n.id);
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={on ? 22 : 18}
                      fill={on ? "var(--accent)" : "#FFFFFF"}
                      stroke={on ? "var(--accent)" : "rgba(0,0,0,.15)"}
                      strokeWidth="1.5"
                      style={{ transition: "r .35s, fill .35s, stroke .35s" }} />
              <text x={n.x} y={n.y + 36} textAnchor="middle" fontSize="9" fill="var(--ink-700)"
                    fontFamily="var(--font-geist-mono), monospace">{n.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
