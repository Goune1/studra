import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getLocalizedPathname,
  getPathnameWithoutLocale,
  shouldHandleI18n,
} from '../src/i18n/pathname.ts'

test('removes supported locale prefixes without changing unprefixed French paths', () => {
  assert.deepEqual(getPathnameWithoutLocale('/en/dashboard'), {
    locale: 'en',
    pathname: '/dashboard',
  })
  assert.deepEqual(getPathnameWithoutLocale('/dashboard'), {
    locale: 'fr',
    pathname: '/dashboard',
  })
  assert.deepEqual(getPathnameWithoutLocale('/not-a-locale/dashboard'), {
    locale: 'fr',
    pathname: '/not-a-locale/dashboard',
  })
})

test('builds unprefixed French redirects and prefixed translated redirects', () => {
  assert.equal(getLocalizedPathname('/login', 'fr'), '/login')
  assert.equal(getLocalizedPathname('/login', 'en'), '/en/login')
  assert.equal(getLocalizedPathname('/', 'de'), '/de')
})

test('runs i18n only for localized page routes', () => {
  for (const path of ['/', '/dashboard', '/en/dashboard', '/blog/article']) {
    assert.equal(shouldHandleI18n(path), true, path)
  }

  for (const path of [
    '/admin',
    '/api/generate/flashcards',
    '/api/webhooks/stripe',
    '/auth/callback',
    '/_next/static/chunk.js',
    '/favicon.ico',
    '/image.png',
  ]) {
    assert.equal(shouldHandleI18n(path), false, path)
  }
})
