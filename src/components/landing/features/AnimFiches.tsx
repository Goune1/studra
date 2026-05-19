export default function AnimFiches() {
  const rows = Array(2).fill(null);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ position: "relative", height: "100%", borderRadius: 10, background: "#FFFFFF", border: "1px solid rgba(0,0,0,.06)", overflow: "hidden", padding: 16 }}>
        <div style={{ animation: "ficheScroll 16s linear infinite", display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((_, n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.01em", marginTop: 8 }}>III. La Révolution française</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>1. Les causes</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>La dette de l&apos;État après les guerres de Louis XV et XVI <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> fragilise la monarchie.</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>Les mauvaises récoltes <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> de 1788 provoquent une flambée des prix.</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>2. La rupture</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>Les états généraux convoqués <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> en mai 1789.</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>Le serment du Jeu de paume <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} /> radicalise les députés.</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>3. La nuit du 4 août</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-700)" }}>Abolition des privilèges et droits féodaux <span style={{ display: "inline-block", width: 60, height: 10, background: "var(--accent-soft)", borderRadius: 2, verticalAlign: "middle", margin: "0 2px" }} />.</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24, background: "linear-gradient(180deg, #fff, transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, background: "linear-gradient(0deg, #fff, transparent)", pointerEvents: "none" }} />
      </div>
      <style>{`@keyframes ficheScroll { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }`}</style>
    </div>
  );
}
