import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))

const translatedComponents = [
  'src/components/landing/nav/Nav.tsx',
  'src/components/landing/hero/Hero.tsx',
  'src/components/landing/hero/MockupWindow.tsx',
  'src/components/landing/HowItWorks.tsx',
  'src/components/landing/features/Features.tsx',
  'src/components/landing/Method.tsx',
  'src/components/landing/Pricing.tsx',
  'src/components/landing/FAQ.tsx',
  'src/components/landing/SeoLinks.tsx',
  'src/components/landing/FinalCTA.tsx',
  'src/components/landing/Footer.tsx',
  'src/components/landing/LandingJsonLd.tsx',
  'src/components/landing/features/AnimExam.tsx',
  'src/components/landing/features/AnimFiches.tsx',
  'src/components/landing/features/AnimFlashcards.tsx',
  'src/components/landing/features/AnimPlanning.tsx',
  'src/components/landing/features/AnimRappel.tsx',
  'src/components/landing/features/AnimSchemas.tsx',
  'src/components/landing/features/AnimSocrate.tsx',
  'src/components/landing/hero/scenes/SceneGenerate.tsx',
  'src/components/landing/hero/scenes/SceneImport.tsx',
  'src/components/landing/hero/scenes/ScenePlanning.tsx',
  'src/components/landing/hero/scenes/SceneReview.tsx'
]

const requiredNamespaces = [
  'metadata',
  'nav',
  'hero',
  'mockup',
  'howItWorks',
  'features',
  'method',
  'pricing',
  'faq',
  'seoLinks',
  'finalCta',
  'footer',
  'jsonLd',
  'animations'
]

test('defines a structured French catalog for every landing section', () => {
  assert.ok(messages.landing)
  for (const namespace of requiredNamespaces) {
    assert.ok(messages.landing[namespace], `missing landing.${namespace}`)
    assert.ok(Object.keys(messages.landing[namespace]).length > 0, `empty landing.${namespace}`)
  }
})

test('localizes landing metadata at request time', () => {
  const page = read('src/app/[locale]/page.tsx')
  assert.match(page, /export\s+async\s+function\s+generateMetadata/)
  assert.match(page, /getTranslations\(/)
  assert.doesNotMatch(page, /export\s+const\s+metadata\s*:/)
})

test('connects every visible landing section to next-intl', () => {
  for (const path of translatedComponents) {
    const source = read(path)
    assert.match(
      source,
      /\b(useTranslations|getTranslations)\s*\(/,
      `${path} does not read translated messages`
    )
  }
})

test('stores FAQ copy as translation keys instead of French content data', () => {
  const faqData = read('src/components/landing/faq-data.ts')
  assert.doesNotMatch(faqData, /C'est différent d'Anki|Mes cours sont confidentiels|Studra remplace mon prof/)
  assert.match(faqData, /questionKey/)
  assert.match(faqData, /answerKey/)
})
