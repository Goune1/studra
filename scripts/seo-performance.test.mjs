import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))

test('le contenu principal du hero reste visible avant les animations', () => {
  const hero = read('src/components/landing/hero/Hero.tsx')
  const fadeRule = hero.match(/\.fade-up\s*\{([^}]*)\}/s)?.[1] ?? ''
  assert.doesNotMatch(fadeRule, /opacity\s*:\s*0/)
})

test('PostHog ne charge pas les modules marketing lourds', () => {
  const providers = read('src/app/providers.tsx')
  assert.match(providers, /disable_session_recording:\s*true/)
  assert.match(providers, /disable_surveys:\s*true/)
  assert.match(providers, /advanced_disable_flags:\s*true/)
  assert.match(providers, /autocapture:\s*false/)
})

test('la CSP ne casse pas les assets sur un serveur local HTTP', () => {
  assert.doesNotMatch(read('next.config.ts'), /upgrade-insecure-requests/)
})

test('la FAQ visible et le JSON-LD partagent une source unique', () => {
  const faq = read('src/components/landing/FAQ.tsx')
  const jsonLd = read('src/components/landing/LandingJsonLd.tsx')
  assert.match(faq, /FAQ_ITEMS/)
  assert.match(jsonLd, /FAQ_ITEMS/)
  assert.doesNotMatch(jsonLd, /const faqSchema/)
})

test('les titres locaux ne dupliquent pas le template Studra', () => {
  const files = [
    'src/app/[locale]/(seo)/flashcards-ia/page.tsx',
    'src/app/[locale]/(seo)/fiches-de-revision-ia/page.tsx',
    'src/app/[locale]/(seo)/repetition-espacee/page.tsx',
    'src/app/[locale]/(seo)/examen-blanc-ia/page.tsx',
    'src/app/[locale]/changelog/page.tsx',
  ]
  for (const file of files) {
    const source = read(file)
    const title = source.match(/(?:export const metadata|const baseMetadata)[\s\S]*?title:\s*['"]([^'"]+)['"]/)?.[1] ?? ''
    assert.ok(title, `titre introuvable dans ${file}`)
    assert.doesNotMatch(title, /Studra/)
  }
})

test('le sitemap référence le changelog', () => {
  assert.match(read('src/app/sitemap.ts'), /pathname:\s*['"]\/changelog['"]/)
})

test('la page blog déclare une image Open Graph', () => {
  const source = read('src/app/[locale]/blog/page.tsx')
  const openGraph = source.match(/openGraph:\s*\{([\s\S]*?)\n\s*\},\n\}/)?.[1] ?? ''
  assert.match(openGraph, /images:/)
})

test('les pages légales restent suivables', () => {
  for (const file of ['src/app/[locale]/cgu/page.tsx', 'src/app/[locale]/cgv/page.tsx', 'src/app/[locale]/confidentialite/page.tsx']) {
    assert.match(read(file), /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/)
  }
})

test('le texte atténué respecte un contraste AA', () => {
  const css = read('src/app/globals.css')
  assert.doesNotMatch(css, /--ink-400:\s*#A1A1AA/i)
})

test('le CTA des fonctionnalités décrit réellement sa destination', () => {
  const source = read('src/components/landing/features/Features.tsx')
  assert.doesNotMatch(source, /Voir toutes les fonctionnalités en détail[\s\S]{0,300}href=["']\/blog\/?["']/)
})

test('les logos affichés passent par l’optimiseur Next Image', () => {
  const files = [
    'src/components/sidebar.tsx',
    'src/components/landing/nav/Nav.tsx',
    'src/components/landing/Footer.tsx',
    'src/components/landing/hero/MockupWindow.tsx',
  ]
  for (const file of files) {
    const logoLines = read(file).split('\n').filter((line) => line.includes('studra-logo.png'))
    assert.ok(logoLines.length > 0, `logo introuvable dans ${file}`)
    for (const line of logoLines) assert.doesNotMatch(line, /unoptimized/)
  }
})

test('les articles ne promettent pas une année ou un gain obsolète', () => {
  const posts = read('src/lib/blog-posts.ts')
  assert.doesNotMatch(posts, /comparatif complet 2025|avec l'IA en 2025|mémoriser 3x plus vite/)
})

test('les pages noindex ne canonisent pas vers l’accueil', () => {
  for (const file of [
    'src/app/[locale]/(auth)/layout.tsx',
    'src/app/[locale]/(dashboard)/layout.tsx',
    'src/app/admin/layout.tsx',
    'src/app/[locale]/unsubscribe/page.tsx',
  ]) {
    const source = read(file)
    assert.match(source, /robots:\s*\{\s*index:\s*false/)
    assert.match(source, /canonical:\s*null/)
  }
  const notFound = read('src/app/[locale]/not-found.tsx')
  assert.match(notFound, /robots:\s*\{\s*index:\s*false/)
  assert.match(notFound, /canonical:\s*null/)
})

test('le pricing décrit le quota réellement appliqué au plan gratuit', () => {
  const pricing = JSON.stringify(messages.landing.pricing)
  assert.match(pricing, /5 générations IA par mois/)
  assert.doesNotMatch(pricing, /3 decks de flashcards|Fiches illimitées|2 par semaine/)
})

test('le hero positionne Studra sur la décision de révision quotidienne', () => {
  const hero = JSON.stringify(messages.landing.hero)
  assert.match(hero, /quoi réviser aujourd’hui/)
  assert.doesNotMatch(hero, /Pour le bac 2026 et après/)
})

test('la page FSRS évite les certitudes scientifiques et techniques trompeuses', () => {
  const page = read('src/app/[locale]/(seo)/repetition-espacee/page.tsx')
  assert.doesNotMatch(page, /moment exact|scientifiquement prouvée|SM-2 \(Anki\)|dernière version|15 à 20 %/)
  assert.match(page, /Encore \/ Difficile \/ Bien \/ Facile/)
  assert.match(page, /prochain intervalle/)
})
