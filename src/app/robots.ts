import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/flashcards/',
          '/fiches/',
          '/schemas/',
          '/timelines/',
          '/exams/',
          '/lacunes/',
          '/settings/',
          '/billing/',
          '/admin/',
          '/api/',
          '/auth/',
          '/socrate/',
          '/recall/',
          '/annales/',
          '/planning/',
          '/upgrade/',
        ],
      },
    ],
    sitemap: 'https://studra.fr/sitemap.xml',
  }
}
