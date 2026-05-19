import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LandingTracker } from '@/components/landing/LandingTracker'
import { LandingJsonLd }  from '@/components/landing/LandingJsonLd'
import Nav      from '@/components/landing/nav/Nav'
import Hero     from '@/components/landing/hero/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/features/Features'
import Method   from '@/components/landing/Method'
import Pricing  from '@/components/landing/Pricing'
import FAQ      from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer   from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: "Studra — Révise sérieusement. Sans y passer ses nuits.",
  description:
    "Colle ton cours. Studra le transforme en flashcards, fiches, schémas et examens blancs. Le moteur de répétition espacée s'occupe du reste.",
  alternates: {
    canonical: 'https://studra.fr',
    languages: { fr: 'https://studra.fr' },
  },
  openGraph: {
    title: "Studra — Révise sérieusement. Sans y passer ses nuits.",
    description:
      "Colle ton cours. Studra le transforme en flashcards, fiches, schémas et examens blancs. Le moteur de répétition espacée s'occupe du reste.",
    url: 'https://studra.fr',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Studra — Révise sérieusement. Sans y passer ses nuits.",
    description:
      "Colle ton cours. Studra le transforme en flashcards, fiches, schémas et examens blancs. Le moteur de répétition espacée s'occupe du reste.",
  },
}

export default function LandingPage() {
  return (
    <div className="landing-v2">
      <LandingJsonLd />
      <Suspense fallback={null}>
        <LandingTracker />
      </Suspense>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Method />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
