import { Nav } from '@/components/landing/Nav'
import { Footer } from '@/components/landing/Footer'

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg text-fg min-h-screen">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
