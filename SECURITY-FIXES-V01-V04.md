# Security Fixes V-01 to V-04

## Files changed or created

- `supabase/migrations/011_fix_profiles_rls.sql`
- `supabase/migrations/012_pronote_encrypt.sql`
- `src/lib/ai-rate-limit.ts`
- `src/lib/crypto.ts`
- `src/lib/supabase/admin.ts`
- `scripts/encrypt-pronote-backfill.ts`
- OpenAI routes under `src/app/api/**/route.ts`
- Pronote routes: `connect`, `connect-qr`, `sync`
- Bac dashboard loader: `src/app/(dashboard)/bac/page.tsx`
- `package.json`, `package-lock.json`

## Deployment order

1. Install dependencies: `npm install`.
2. Add `PRONOTE_TOKEN_ENCRYPTION_KEY` locally and in Vercel env vars. Generate it with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Deploy the application code. The code can read legacy plaintext and encrypted Pronote values.
4. Apply `supabase/migrations/011_fix_profiles_rls.sql`.
5. Run the Pronote backfill: `npx tsx scripts/encrypt-pronote-backfill.ts`.
6. Apply `supabase/migrations/012_pronote_encrypt.sql` to convert `raw_data` from `jsonb` to `text`.
7. Redeploy/restart so all instances have the same env vars and code.

## Environment variables

- `PRONOTE_TOKEN_ENCRYPTION_KEY`: 64 hex chars, generated from 32 random bytes.
- Existing required vars still apply: Supabase URL/keys, OpenAI key, Stripe, Resend.

## Behavior changes

- All authenticated OpenAI-backed endpoints now share a hard limit of 200 AI calls/day/user.
- Each AI endpoint also has a burst limit of 30 calls/hour/user/scope.
- AI rate-limit failures return HTTP 429 with either daily-limit or burst-limit messages.
- `/api/extract-image-text` rejects images over 5 MB, rejects non JPEG/PNG/WEBP images, and caps output at 2048 tokens.
- `/api/bac/identify` sends at most 20 Pronote subjects to OpenAI.
- Recall evaluation and Socrate diagnosis reject user text over 50,000 characters.
- Pronote `username`, `refresh_token`, and `raw_data` are encrypted at rest.

## Manual smoke tests

- Login works.
- `/dashboard` is accessible for an authenticated user.
- `/admin` redirects for a non-admin user.
- At least one generation page works.
- A free user cannot run `sb.from('profiles').update({ plan: 'pro' }).eq('id', userId)`; it must fail with code `42501`.
- Pronote connect, QR connect, sync, and Bac page display work after backfill.
- A large or unsupported image upload to `/api/extract-image-text` returns 413 or 415.

## Audit and build

- `npm run build` passes on Next.js 16.2.6.
- `npm audit` no longer reports the requested critical Next.js advisories.
- Residual audit finding: moderate `postcss <8.5.10` inside `next@16.2.6`; `npm audit fix --force` proposes a breaking downgrade to Next 9.3.3, so it was not applied.

## Rollback plan

- V-01 RLS: drop trigger `prevent_profile_privilege_escalation`, drop function `public.prevent_profile_privilege_escalation`, and restore the old update policy only if an emergency requires it.
- V-02 rate-limit: revert route imports/usages of `checkAiRateLimit` and remove `src/lib/ai-rate-limit.ts`.
- V-03 Next upgrade: pin `next` and `eslint-config-next` back to `16.2.2`, run `npm install`, then rebuild.
- V-04 Pronote encryption: rollback code first to a version that can still read encrypted values, or keep `decryptToken` compatibility. To restore queryable JSON, decrypt rows with the service role into plaintext JSON, convert `raw_data` back to `jsonb`, then remove encryption writes.
