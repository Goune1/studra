"use client";

interface CursorProps {
  x: number;
  y: number;
  clicking: boolean;
}

export default function Cursor({ x, y, clicking }: CursorProps) {
  return (
    <div style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      zIndex: 4,
      pointerEvents: "none",
      transform: `translate(-2px,-2px) scale(${clicking ? 0.85 : 1})`,
      transition: "left .8s cubic-bezier(.3,.7,.2,1), top .8s cubic-bezier(.3,.7,.2,1), transform .15s",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,.18))",
    }}>
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
        <path d="M1 1L1 14L4.5 11.5L7 17L9 16L6.5 10.5L11 10.5L1 1Z"
              fill="#18181B" stroke="#FFF" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
