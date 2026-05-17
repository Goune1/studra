import { ImageResponse } from 'next/og'

export const alt = "Studra, répétition espacée FSRS pour réviser efficacement"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a14 0%, #12122a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            }}
          />
          <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>Studra</span>
        </div>
        <div
          style={{
            color: '#7c7cff',
            fontSize: 18,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Science de la mémoire
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 800,
            marginBottom: 32,
          }}
        >
          Répétition espacée avec FSRS 5
        </div>
        <div style={{ color: '#9ca3af', fontSize: 24, maxWidth: 680, lineHeight: 1.5 }}>
          L&apos;algorithme le plus précis pour mémoriser durablement. Planification automatique des révisions.
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: 100,
              padding: '8px 20px',
              color: '#a5b4fc',
              fontSize: 16,
            }}
          >
            studra.fr/repetition-espacee
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
