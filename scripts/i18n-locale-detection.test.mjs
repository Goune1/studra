import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  parseAcceptLanguage,
  resolveLocalePreference,
} from '../src/i18n/pathname.ts'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('an explicit locale in the URL wins over automatic preferences', () => {
  assert.equal(resolveLocalePreference({
    pathnameLocale: 'it',
    profileLocale: 'de',
    cookieLocale: 'es',
    acceptLanguage: 'pt-BR,pt;q=0.9',
  }), 'it')
})

test('an authenticated profile preference wins over cookie and browser language', () => {
  assert.equal(resolveLocalePreference({
    profileLocale: 'de',
    cookieLocale: 'es',
    acceptLanguage: 'pt-BR,pt;q=0.9',
  }), 'de')
})

test('NEXT_LOCALE wins over Accept-Language', () => {
  assert.equal(resolveLocalePreference({
    cookieLocale: 'es',
    acceptLanguage: 'de-DE,de;q=0.9',
  }), 'es')
})

test('Accept-Language selects the best supported base locale by quality', () => {
  assert.equal(parseAcceptLanguage('nl-NL;q=0.9, de-DE;q=0.8, pt-BR;q=1'), 'pt')
  assert.equal(parseAcceptLanguage('nl-NL, de-DE;q=0.9'), 'de')
})

test('invalid preferences fall back to French', () => {
  assert.equal(resolveLocalePreference({
    profileLocale: 'xx',
    cookieLocale: 'invalid',
    acceptLanguage: 'nl-NL,ja;q=0.8',
  }), 'fr')
})

test('phase 3 persists locale and exposes selectors in header and settings', () => {
  const routing = read('src/i18n/routing.ts')
  const proxy = read('src/proxy.ts')
  const middleware = read('src/lib/supabase/middleware.ts')
  const action = read('src/app/[locale]/locale-actions.ts')
  const selector = read('src/components/LanguageSelector.tsx')
  const nav = read('src/components/landing/nav/Nav.tsx')
  const settings = read('src/app/[locale]/(dashboard)/settings/page.tsx')
  const migration = read('supabase/migrations/014_preferred_locale.sql')

  assert.match(routing, /localeDetection:\s*true/)
  assert.match(routing, /name:\s*['"]NEXT_LOCALE['"]/)
  assert.match(proxy, /pathnameLocale/)
  assert.match(middleware, /preferred_locale/)
  assert.match(middleware, /resolveLocalePreference/)
  assert.match(middleware, /request\.cookies\.set\(LOCALE_COOKIE, locale\)/)
  assert.match(action, /cookies\(\)/)
  assert.match(action, /preferred_locale/)
  assert.match(action, /try\s*{/)
  assert.match(action, /catch\s*{/)
  assert.match(selector, /getPathname/)
  assert.match(selector, /window\.location\.assign/)
  assert.match(selector, /if \(!result\.ok\)/)
  assert.match(selector, /window\.location\.search/)
  assert.match(selector, /window\.location\.hash/)
  assert.match(nav, /LanguageSelector/)
  assert.match(settings, /LanguageSelector/)
  assert.match(migration, /preferred_locale text/)
  assert.match(migration, /'fr'.*'en'.*'es'.*'pt'.*'de'.*'it'/s)
})
