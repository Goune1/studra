const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://studra.fr/#organization',
      name: 'Studra',
      url: 'https://studra.fr',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://studra.fr/#website',
      url: 'https://studra.fr',
      name: 'Studra',
      description: "Révision intelligente avec l'IA",
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Studra',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      inLanguage: 'fr',
    },
  ],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonLdScript({ data }: { data: any }) {
  const html = { __html: JSON.stringify(data) }
  return <script type="application/ld+json" dangerouslySetInnerHTML={html} />
}

export function LandingJsonLd() {
  return <JsonLdScript data={schema} />
}
