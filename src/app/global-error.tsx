'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: '0 16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#0E0D0B',
          color: '#FFFFFF',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 26,
            }}
          >
            ⚠
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 12px',
              color: '#FFFFFF',
            }}
          >
            Une erreur est survenue
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#94A3B8',
              margin: '0 0 32px',
              lineHeight: 1.6,
            }}
          >
            Un problème inattendu s&apos;est produit. Notre équipe en est informée.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                background: 'linear-gradient(180deg, #7477ff, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                maxWidth: 220,
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{ color: '#94A3B8', fontSize: 14, textDecoration: 'none' }}
            >
              Retour à l&apos;accueil
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 32, fontSize: 12, color: '#475569' }}>
              Code&nbsp;: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
