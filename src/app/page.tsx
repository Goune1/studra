import type { Metadata } from 'next'
import { Suspense }     from 'react'
import { Nav }          from '@/components/landing/Nav'
import { Hero }         from '@/components/landing/Hero'
import { LandingTracker } from '@/components/landing/LandingTracker'
import { Formats }      from '@/components/landing/Formats'
import { Features }     from '@/components/landing/Features'
import { HowItWorks }   from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing }      from '@/components/landing/Pricing'
import { FAQ }          from '@/components/landing/FAQ'
import { CTA }          from '@/components/landing/CTA'
import { Footer }       from '@/components/landing/Footer'
import { LandingJsonLd } from '@/components/landing/LandingJsonLd'
import { SeoLinks }     from '@/components/landing/SeoLinks'

export const metadata: Metadata = {
  title: "Studra — Flashcards IA, Fiches de révision & Répétition espacée",
  description:
    "Transforme n'importe quel cours en flashcards, fiches de révision et examens blancs grâce à l'IA. Répétition espacée FSRS, méthode Socrate, planning de révision. Gratuit.",
  alternates: {
    canonical: 'https://studra.fr',
    languages: { fr: 'https://studra.fr' },
  },
  openGraph: {
    title: "Studra — Flashcards IA, Fiches de révision & Répétition espacée",
    description:
      "Transforme n'importe quel cours en flashcards, fiches de révision et examens blancs grâce à l'IA. Répétition espacée FSRS, méthode Socrate, planning de révision. Gratuit.",
    url: 'https://studra.fr',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Studra — Flashcards IA, Fiches de révision & Répétition espacée",
    description:
      "Transforme n'importe quel cours en flashcards, fiches de révision et examens blancs grâce à l'IA. Répétition espacée FSRS, méthode Socrate, planning de révision. Gratuit.",
  },
}

export default function LandingPage() {
  return (
    <div className="bg-bg text-fg min-h-screen">
      <LandingJsonLd />
      <Suspense fallback={null}>
        <LandingTracker />
      </Suspense>
      <Nav />
      <main>
        <Hero />
        <Formats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <SeoLinks />
        <Suspense fallback={<div className="py-30 px-7 min-h-140" />}>
          <Pricing />
        </Suspense>
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
