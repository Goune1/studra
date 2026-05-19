"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const PATTERN = [
  [1, 0, 1, 0, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 1],
];
const COLORS = ["green", "blue", "orange", "green", "blue", "orange", "green"];
const COLOR_MAP: Record<string, string> = {
  green:  "rgba(31,77,63,.85)",
  blue:   "rgba(29,78,216,.65)",
  orange: "rgba(194,65,12,.7)",
};

export default function AnimPlanning() {
  const cells = useMemo(() => {
    const out: { r: number; c: number; color: string }[] = [];
    PATTERN.forEach((row, r) => row.forEach((v, c) => { if (v) out.push({ r, c, color: COLORS[(r + c) % COLORS.length] }); }));
    return out;
  }, []);

  const [shown, setShown] = useState<number[]>([]);

  useEffect(() => {
    let i = 0;
    let loop: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i < cells.length) {
        setShown((prev) => [...prev, i]);
        i++;
        loop = setTimeout(next, 180);
      } else {
        loop = setTimeout(() => { setShown([]); i = 0; loop = setTimeout(next, 600); }, 2400);
      }
    };
    loop = setTimeout(next, 300);
    return () => clearTimeout(loop);
  }, [cells.length]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {DAYS.map((d) => (
          <div key={d} className="mono" style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-400)", textAlign: "center" }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {[0, 1, 2, 3].map((r) => (
          <div key={r} style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((c) => {
              const cell = cells.find((x) => x.r === r && x.c === c);
              const idx = cell ? cells.indexOf(cell) : -1;
              const on = idx !== -1 && shown.includes(idx);
              return (
                <div key={c} style={{
                  borderRadius: 6,
                  background: on ? COLOR_MAP[cell!.color] : "rgba(0,0,0,.04)",
                  transition: "background .35s cubic-bezier(.34,1.4,.64,1)",
                }} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
