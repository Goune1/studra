import type { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-posts'

const BASE_URL = 'https://studra.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: '2026-04-24',
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/flashcards-ia`,
      lastModified: '2026-04-24',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/fiches-de-revision-ia`,
      lastModified: '2026-04-24',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/repetition-espacee`,
      lastModified: '2026-04-24',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/examen-blanc-ia`,
      lastModified: '2026-04-24',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: '2026-04-24',
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogEntries,
    {
      url: `${BASE_URL}/cgu`,
      lastModified: '2026-04-10',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgv`,
      lastModified: '2026-04-10',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/confidentialite`,
      lastModified: '2026-04-19',
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
