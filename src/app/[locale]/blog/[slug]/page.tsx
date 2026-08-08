import type {Locale} from 'next-intl'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'
import { blogPosts, getBlogPost, type ContentBlock } from '@/lib/blog-posts'
import { setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://studra.fr/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://studra.fr/blog/${post.slug}`,
      siteName: 'Studra',
      locale: 'fr_FR',
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`https://studra.fr/blog/${post.slug}/opengraph-image`],
    },
  }
}

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={i} className="font-serif text-[clamp(22px,3vw,32px)] tracking-[-0.02em] mt-10 mb-4">
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={i} className="font-serif text-[clamp(18px,2.5vw,24px)] tracking-[-0.015em] mt-7 mb-3">
          {block.text}
        </h3>
      )
    case 'p':
      return (
        <p key={i} className="text-fg-dim text-[16px] leading-[1.7] mb-4">
          {block.text}
        </p>
      )
    case 'ul':
      return (
        <ul key={i} className="my-4 space-y-2.5 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-fg-dim text-[15px] leading-[1.6]">
              <span className="tick mt-1 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={i} className="my-4 space-y-2.5 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-fg-dim text-[15px] leading-[1.6]">
              <span className="font-mono text-[12px] text-accent w-5 flex-shrink-0 mt-0.5">{j + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div key={i} className="my-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line">
                {block.headers.map((h) => (
                  <th key={h} className="text-left py-3 pr-5 text-fg-mute font-mono text-[11px] uppercase tracking-[0.1em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-line/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`py-3.5 pr-5 text-[14px] leading-[1.5] ${ci === 0 ? 'text-fg' : 'text-fg-dim'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params
  setRequestLocale(locale as Locale)
  const post = getBlogPost(slug)
  if (!post) notFound()

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: `https://studra.fr/blog/${post.slug}/opengraph-image`,
    inLanguage: 'fr',
    author: { '@type': 'Organization', name: 'Studra' },
    publisher: { '@type': 'Organization', name: 'Studra', url: 'https://studra.fr' },
    url: `https://studra.fr/blog/${post.slug}`,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://studra.fr' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://studra.fr/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://studra.fr/blog/${post.slug}` },
    ],
  }

  return (
    <div className="landing-v2 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Nav />
      <main>
        {/* Header */}
        <header className="py-24 px-7 border-b border-line">
          <div className="max-w-[760px] mx-auto">
            <nav className="text-sm text-fg-mute mb-8 flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-fg transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-fg transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-fg">{post.title}</span>
            </nav>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-[10px] text-accent uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border border-accent/30 bg-accent/[0.08]">
                {post.category}
              </span>
              <span className="font-mono text-[11px] text-fg-mute">{post.readingTime} de lecture</span>
              <span className="font-mono text-[11px] text-fg-mute">{post.publishedAt}</span>
            </div>
            <h1 className="font-serif text-[clamp(32px,5vw,52px)] leading-[1.08] tracking-[-0.025em] mb-5">
              {post.title}
            </h1>
            <p className="text-[18px] text-fg-dim leading-[1.6]">{post.description}</p>
          </div>
        </header>

        {/* Content */}
        <article className="py-16 px-7">
          <div className="max-w-[760px] mx-auto">
            {post.content.map((block, i) => renderBlock(block, i))}

            {/* FAQ */}
            <div className="mt-14 pt-10 border-t border-line">
              <h2 className="font-serif text-[clamp(22px,3vw,32px)] tracking-[-0.02em] mb-8">
                Questions fréquentes
              </h2>
              <div className="border-t border-line">
                {post.faq.map((item, i) => (
                  <details key={i} className="faq border-b border-line py-5 px-1 cursor-pointer">
                    <summary className="flex justify-between items-center gap-4 cursor-pointer">
                      <span className="font-serif text-[19px] tracking-[-0.015em]">{item.q}</span>
                      <span className="faq-plus" />
                    </summary>
                    <p className="text-fg-dim text-[15px] leading-[1.6] pt-3.5 pb-1.5 max-w-[68ch]">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-14 pt-10 border-t border-line text-center">
              <h2 className="font-serif text-[26px] tracking-[-0.02em] mb-4">
                Prêt à mettre en pratique ?
              </h2>
              <p className="text-fg-dim text-[15px] leading-[1.6] mb-6 max-w-[50ch] mx-auto">
                Génère tes premières flashcards depuis ton cours gratuitement. FSRS 5 intégré, sans installation.
              </p>
              <Link href="/register" className="btn btn-primary">
                Créer mon compte gratuitement <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </article>

        {/* Autres articles */}
        <section className="py-16 px-7 border-t border-line">
          <div className="max-w-[1240px] mx-auto">
            <h2 className="font-mono text-[11px] text-fg-mute uppercase tracking-[0.15em] mb-6">
              Autres articles
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {blogPosts
                .filter((p) => p.slug !== post.slug)
                .slice(0, 3)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 hover:border-accent/40 transition-colors"
                  >
                    <span className="font-mono text-[10px] text-accent uppercase tracking-[0.1em]">{p.category}</span>
                    <h3 className="font-serif text-[18px] leading-[1.25] tracking-[-0.015em] mt-2 mb-2">{p.title}</h3>
                    <p className="text-fg-dim text-[13px] leading-[1.55]">{p.description}</p>
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
