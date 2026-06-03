import type { Metadata } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono, DM_Serif_Display, DM_Sans, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PostHogProvider } from './providers'
import { Suspense } from 'react'
import { AffiliateTracker } from '@/components/affiliate/AffiliateTracker'

const inter = Inter({ subsets: ['latin'] })

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const displayFont = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://studra.fr'),
  title: {
    default: "Studra – Révise grâce a des flashcards et des fiches IA",
    template: '%s | Studra',
  },
  description:
    "Studra génère des flashcards, fiches de révision, schémas conceptuels, frises chronologiques et examens depuis ton cours, PDF ou vidéo YouTube — en moins de 10 secondes. Propulsé par l'IA.",
  keywords: [
    'révision intelligente',
    'flashcards IA',
    'fiche de révision automatique',
    'schéma conceptuel IA',
    'frise chronologique automatique',
    'examen IA',
    'aide aux révisions',
    'étudiant lycée université',
    'studra',
  ],
  authors: [{ name: 'Studra', url: 'https://studra.fr' }],
  creator: 'Studra',
  publisher: 'Studra',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://studra.fr',
    siteName: 'Studra',
    title: "Studra – Révision intelligente avec l'IA",
    description:
      'Génère des flashcards, fiches de révision, schémas et examens depuis ton cours en moins de 10 secondes.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: "Studra – Révision intelligente avec l'IA",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Studra – Révision intelligente avec l'IA",
    description:
      'Génère des flashcards, fiches de révision, schémas et examens depuis ton cours en moins de 10 secondes.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: 'https://studra.fr',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} ${displayFont.variable} ${monoFont.variable} ${dmSerif.variable} ${dmSans.variable} ${geist.variable} ${geistMono.variable} min-h-screen`}
        style={{ background: 'var(--app-bg)', color: 'var(--text-1)', transition: 'background 0.2s, color 0.2s' }}
      >
        <PostHogProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>
            {children}
          </ThemeProvider>
        </PostHogProvider>
        <Toaster position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
