import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
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
import { SeoLinks } from '@/components/landing/SeoLinks'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer   from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: "Studra – Ton plan de révision avec flashcards IA",
  description:
    "Ajoute ton cours. Studra te montre quoi réviser aujourd’hui, génère tes supports et planifie les prochains rappels selon tes réponses.",
  alternates: {
    canonical: 'https://studra.fr',
  },
  openGraph: {
    title: "Studra – Ton plan de révision avec flashcards IA",
    description:
      "Ajoute ton cours. Studra te montre quoi réviser aujourd’hui, génère tes supports et planifie les prochains rappels selon tes réponses.",
    url: 'https://studra.fr',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Studra – Ton plan de révision avec flashcards IA",
    description:
      "Ajoute ton cours. Studra te montre quoi réviser aujourd’hui, génère tes supports et planifie les prochains rappels selon tes réponses.",
  },
}

export default async function LandingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
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
        <SeoLinks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
