import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Studra – Révision intelligente avec l'IA"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(99,102,241,0.07) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 60,
            width: 400,
            height: 400,
            background: 'rgba(99,102,241,0.12)',
            borderRadius: '50%',
            filter: 'blur(100px)',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 999,
              padding: '8px 16px',
              width: 'fit-content',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#818cf8',
              }}
            />
            <span style={{ color: '#818cf8', fontSize: 16, letterSpacing: 2 }}>
              Propulsé par GPT-4o mini
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              color: 'white',
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Gagne du temps,{'\n'}
            <span style={{ color: '#6366f1' }}>Retiens mieux.</span>
          </div>

          {/* Subheadline */}
          <div
            style={{
              color: '#9ca3af',
              fontSize: 22,
              lineHeight: 1.5,
              maxWidth: 700,
              marginBottom: 48,
            }}
          >
            Flashcards · Fiches · Schémas · Frises · Examens — générés depuis ton
            cours en moins de 10 secondes.
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 16 }}>
            {['5 formats', '9 langues', '< 10s'].map((s) => (
              <div
                key={s}
                style={{
                  color: '#c7d2fe',
                  fontSize: 18,
                  fontWeight: 600,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 12,
                  padding: '10px 22px',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Brand name bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 80,
            color: '#6366f1',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          studra.fr
        </div>
      </div>
    ),
    { ...size }
  )
}
