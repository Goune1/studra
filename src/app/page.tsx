import type { Metadata } from 'next'
import { Nav }          from '@/components/landing/Nav'
import { Hero }         from '@/components/landing/Hero'
import { Formats }      from '@/components/landing/Formats'
import { Features }     from '@/components/landing/Features'
import { HowItWorks }   from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing }      from '@/components/landing/Pricing'
import { FAQ }          from '@/components/landing/FAQ'
import { CTA }          from '@/components/landing/CTA'
import { Footer }       from '@/components/landing/Footer'
import { LandingJsonLd } from '@/components/landing/LandingJsonLd'

export const metadata: Metadata = {
  alternates: { canonical: 'https://studra.fr' },
}

export default function LandingPage() {
  return (
    <div className="bg-bg text-fg min-h-screen">
      <LandingJsonLd />
      <Nav />
      <main>
        <Hero />
        <Formats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
