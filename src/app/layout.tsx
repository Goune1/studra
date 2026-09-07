import type {Metadata} from 'next'
import {RootDocument} from '@/components/root-document'
import '@/app/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://studra.fr'),
  title: {
    default: 'Studra – Révise grâce à des flashcards et des fiches IA',
    template: '%s | Studra',
  },
  description:
    'Studra transforme ton cours en flashcards, fiches et examens blancs en 10 secondes. Répétition espacée FSRS 5. Gratuit.',
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
  authors: [{name: 'Studra', url: 'https://studra.fr'}],
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
    title: 'Studra – Révise grâce à des flashcards et des fiches IA',
    description:
      'Génère des flashcards, fiches de révision, schémas et examens depuis ton cours en moins de 10 secondes.',
    images: [{url: '/opengraph-image', width: 1200, height: 630, alt: 'Studra – Révise grâce à des flashcards et des fiches IA'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studra – Révise grâce à des flashcards et des fiches IA',
    description:
      'Génère des flashcards, fiches de révision, schémas et examens depuis ton cours en moins de 10 secondes.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <RootDocument lang="fr">{children}</RootDocument>
}
