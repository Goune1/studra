import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'
import { blogPosts } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Blog Studra — Méthodes de révision et flashcards IA',
  description:
    'Guides pratiques et articles de fond sur la répétition espacée, FSRS, les flashcards IA et les meilleures méthodes de révision pour étudiants.',
  alternates: {
    canonical: 'https://studra.fr/blog',
  },
  openGraph: {
    title: 'Blog Studra — Méthodes de révision et science de la mémoire',
    description:
      'Guides pratiques sur la répétition espacée, FSRS, les flashcards IA et les meilleures méthodes de révision.',
    url: 'https://studra.fr/blog',
    siteName: 'Studra',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Blog Studra — méthodes de révision et science de la mémoire',
      },
    ],
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://studra.fr' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://studra.fr/blog' },
  ],
}

export default async function BlogPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="landing-v2 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Nav />
      <main>
        <section className="py-24 px-7 border-b border-line">
          <div className="max-w-[1240px] mx-auto">
            <nav className="text-sm text-fg-mute mb-8 flex items-center gap-2">
              <Link href="/" className="hover:text-fg transition-colors">Accueil</Link>
              <span>/</span>
              <span className="text-fg">Blog</span>
            </nav>
            <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Méthodes & Science</span>
            <h1 className="font-serif text-[clamp(40px,6vw,64px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-5 max-w-[20ch]">
              Le blog Studra
            </h1>
            <p className="text-[18px] text-fg-dim max-w-[58ch] leading-[1.6]">
              Répétition espacée, algorithmes de mémoire, comparatifs d&apos;outils et guides pratiques pour
              réviser plus efficacement.
            </p>
          </div>
        </section>

        <section className="py-16 px-7">
          <div className="max-w-[1240px] mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[20px] p-7 flex flex-col gap-4 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-accent uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border border-accent/30 bg-accent/[0.08]">
                      {post.category}
                    </span>
                    <span className="font-mono text-[11px] text-fg-mute">{post.readingTime}</span>
                  </div>
                  <h2 className="font-serif text-[20px] leading-[1.2] tracking-[-0.015em]">{post.title}</h2>
                  <p className="text-fg-dim text-sm leading-[1.6] flex-1">{post.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <span className="text-fg-mute text-[12px] font-mono">{post.publishedAt}</span>
                    <span className="text-accent text-sm">Lire →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
