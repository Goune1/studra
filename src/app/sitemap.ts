import type {MetadataRoute} from 'next'
import {blogPosts} from '@/lib/blog-posts'
import {
  buildLocalizedSitemapEntries,
  type SitemapDescriptor,
} from '@/lib/seo-i18n'

const staticDescriptors: SitemapDescriptor[] = [
  {
    pathname: '/',
    lastModified: '2026-04-24',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    pathname: '/flashcards-ia',
    lastModified: '2026-04-24',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    pathname: '/fiches-de-revision-ia',
    lastModified: '2026-04-24',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    pathname: '/repetition-espacee',
    lastModified: '2026-04-24',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    pathname: '/examen-blanc-ia',
    lastModified: '2026-04-24',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    pathname: '/blog',
    lastModified: '2026-04-24',
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    pathname: '/changelog',
    lastModified: '2026-08-06',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    pathname: '/cgu',
    lastModified: '2026-04-10',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    pathname: '/cgv',
    lastModified: '2026-04-10',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    pathname: '/confidentialite',
    lastModified: '2026-04-19',
    changeFrequency: 'yearly',
    priority: 0.2,
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const blogDescriptors: SitemapDescriptor[] = blogPosts.map((post) => ({
    pathname: `/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return buildLocalizedSitemapEntries([
    ...staticDescriptors,
    ...blogDescriptors,
  ])
}
