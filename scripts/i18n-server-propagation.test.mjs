import assert from 'node:assert/strict'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

async function loadLocaleHelpers() {
  const directory = await mkdtemp(join(tmpdir(), 'studra-i18n-'))
  try {
    const compilerOptions = {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017}
    const compile = (source) => ts.transpileModule(source, {compilerOptions}).outputText
    const pathname = await read('src/i18n/pathname.ts')
    const serverLocale = (await read('src/i18n/server-locale.ts'))
      .replace("'@/i18n/pathname'", "'./pathname.js'")

    await Promise.all([
      writeFile(join(directory, 'pathname.js'), compile(pathname)),
      writeFile(join(directory, 'server-locale.js'), compile(serverLocale)),
    ])

    return await import(pathToFileURL(join(directory, 'server-locale.js')).href)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

const generationRoutes = [
  'src/app/api/generate/fiche/route.ts',
  'src/app/api/generate/flashcards/route.ts',
  'src/app/api/generate/schema/route.ts',
]

test('resolves the server locale from profile, cookie and Accept-Language', async () => {
  const source = await read('src/i18n/server-locale.ts')

  assert.match(source, /resolveLocalePreference/)
  assert.match(source, /preferred_locale/)
  assert.match(source, /NEXT_LOCALE/)
  assert.match(source, /accept-language/)
})

test('uses a valid profile locale over a pathname, cookie and Accept-Language', async () => {
  const {resolveServerLocale} = await loadLocaleHelpers()
  const request = new Request('https://studra.test/en/dashboard', {
    headers: {cookie: 'NEXT_LOCALE=es', 'accept-language': 'pt-BR,pt;q=0.9'},
  })

  assert.equal(resolveServerLocale(request, {
    pathname: '/en/dashboard',
    profile: {preferred_locale: 'de'},
  }), 'de')
})

test('uses the cookie before an implicit request pathname', async () => {
  const {resolveServerLocale} = await loadLocaleHelpers()
  const request = new Request('https://studra.test/en/api/generate/fiche', {
    headers: {cookie: 'NEXT_LOCALE=fr', 'accept-language': 'pt-BR,pt;q=0.9'},
  })

  assert.equal(resolveServerLocale(request), 'fr')
})

test('treats malformed locale cookies as absent', async () => {
  const {resolveServerLocale} = await loadLocaleHelpers()
  const request = new Request('https://studra.test/dashboard', {
    headers: {cookie: 'NEXT_LOCALE=%', 'accept-language': 'en-US,en;q=0.9'},
  })

  assert.equal(resolveServerLocale(request), 'en')
})

test('defaults the explicit content language selector to the interface locale', async () => {
  const form = await read('src/components/content-input-form.tsx')
  assert.match(form, /useLocale\(\)/)
  assert.match(form, /useState(?:<string>)?\(locale\)/)
})

test('uses only supported JSON content languages and otherwise falls back to the interface locale', async () => {
  const openai = await read('src/lib/openai.ts')
  const {resolveContentLanguage} = await loadLocaleHelpers()

  assert.equal(resolveContentLanguage('ar', 'en'), 'ar')
  for (const invalidLanguage of ['', '   ', 'ko', null, 42, {}]) {
    assert.equal(resolveContentLanguage(invalidLanguage, 'en'), 'en')
  }

  for (const routePath of generationRoutes) {
    const route = await read(routePath)
    assert.match(route, /resolveServerLocale\(request, \{profile\}\)/)
    assert.match(route, /resolveContentLanguage\(language, locale\)/)
  }

  assert.match(openai, /Generate ALL content in/)
})

test('passes a typed locale to Stripe and keeps localized return URLs', async () => {
  const stripe = await read('src/lib/stripe.ts')
  const checkout = await read('src/app/api/billing/checkout/route.ts')
  const portal = await read('src/app/api/billing/portal/route.ts')

  assert.match(stripe, /locale: AppLocale/)
  assert.match(stripe, /locale,/)
  assert.match(stripe, /getLocalizedPathname\('\/billing', locale\)/)
  assert.doesNotMatch(stripe, /currency\s*:/)
  assert.match(checkout, /preferred_locale/)
  assert.match(checkout, /createCheckoutSession\([^)]*locale/s)
  assert.match(portal, /preferred_locale/)
  assert.match(portal, /createPortalSession\([^)]*locale/s)
})

test('uses locale-aware transactional email templates with a French fallback', async () => {
  const resend = await read('src/lib/resend.ts')
  const register = await read('src/app/api/auth/register/route.ts')
  const callback = await read('src/app/auth/callback/route.ts')
  const webhook = await read('src/app/api/webhooks/stripe/route.ts')

  assert.match(resend, /Partial<Record<AppLocale/)
  assert.match(resend, /transactionalEmailTemplates\[locale\] \?\? transactionalEmailTemplates\.fr/)
  assert.match(resend, /<html lang="\$\{locale\}">/)
  assert.match(resend, /sendWelcomeEmail\(to: string, locale: AppLocale/)
  assert.match(resend, /sendWelcomeProEmail\(to: string, locale: AppLocale/)
  assert.match(resend, /sendSubscriptionCancelledEmail\(to: string, locale: AppLocale/)
  assert.match(register, /resolveServerLocale/)
  assert.match(register, /sendWelcomeEmail\(email, locale\)/)
  assert.match(callback, /sendWelcomeEmail\(user\.email, locale\)/)
  assert.match(webhook, /preferred_locale/)
  assert.match(webhook, /sendWelcomeProEmail\(email, locale\)/)
  assert.match(webhook, /sendSubscriptionCancelledEmail\(email, locale\)/)
})

test('still contains only the French next-intl catalog', async () => {
  const {readdir} = await import('node:fs/promises')
  const catalogs = (await readdir(new URL('messages/', root))).filter((name) => name.endsWith('.json'))
  assert.deepEqual(catalogs, ['fr.json'])
})
