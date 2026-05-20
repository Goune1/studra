import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-v2 min-h-screen">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
