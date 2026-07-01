# Audit de refactorisation massive - Studra

Date de l'audit : 30 juin 2026  
Stack observee : Next.js 16.2.6, React 19.2.4, App Router, Supabase, Vercel, Turbopack.

## Objectif

Identifier les axes de suppression et simplification qui peuvent reduire :

- le JavaScript envoye au navigateur ;
- les rendus et hydrations inutiles ;
- les endpoints internes redondants ;
- les dependances, assets et composants orphelins ;
- les blocages Next.js 16 / React 19 avant une refactorisation lourde.

Hypothese principale : la performance visee vient d'abord de la reduction du code client, de mesures fiables via le build local/CI et de la suppression du code mort. Les optimisations fines de micro-performance viennent apres.

## Sources Next.js / React consultees

Cet audit s'appuie sur `NEXT-BEST-PRACTICES.md`, la skill locale `next-best-practices`, et les docs officielles actuelles :

- Next.js docs : https://nextjs.org/docs
- Upgrade Next.js 16 : https://nextjs.org/docs/app/guides/upgrading/version-16
- Migration `middleware` vers `proxy` : https://nextjs.org/docs/messages/middleware-to-proxy
- Server et Client Components : https://nextjs.org/docs/app/getting-started/server-and-client-components
- Route Handlers : https://nextjs.org/docs/app/getting-started/route-handlers
- Server Actions : https://nextjs.org/docs/app/getting-started/updating-data
- `useSearchParams` et Suspense : https://nextjs.org/docs/app/api-reference/functions/use-search-params
- `next/image` : https://nextjs.org/docs/app/api-reference/components/image
- `next/link` : https://nextjs.org/docs/app/api-reference/components/link
- `next/font` : https://nextjs.org/docs/app/getting-started/fonts
- Turbopack root : https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
- React Hooks lint `set-state-in-effect` : https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect

## Verification effectuee

- `rg --files` : 274 fichiers TypeScript/TSX dans `src`.
- `src/app` : 61 `page.tsx`.
- `src/app/api` : 51 fichiers `route.ts`.
- `rg -l "use client" src` : 102 fichiers contiennent une directive client.
- `npx tsc --noEmit` : OK.
- `npm run lint` : echec, 48 problemes dont 34 erreurs.
- `npm run build` : echec uniquement dans l'environnement Codex, avec racine Turbopack mal inferee vers `C:\Users\goune`. Le build passe sur l'environnement local du mainteneur ; ce point n'est donc pas un blocage codebase confirme.

## Synthese priorisee

### Note - Build observe dans l'environnement Codex

Constat :

- Mon execution de `npm run build` a echoue dans l'environnement Codex avec Next.js 16.2.6 / Turbopack.
- Next y a detecte plusieurs lockfiles et a choisi `C:\Users\goune\package-lock.json` comme racine au lieu de `C:\Users\goune\Documents\studra`.
- Turbopack a ensuite tente de lire `C:\Users\goune` et a plante sur `Acces refuse`.
- Le mainteneur a verifie que le build passe dans son environnement local. Ce probleme doit donc etre considere comme une limite de l'environnement Codex, pas comme une erreur de build applicative.
- Le build Codex a tout de meme signale que la convention `middleware` est depreciee et qu'il faut utiliser `proxy`.

Fichiers concernes :

- `next.config.ts`
- `src/middleware.ts`

Actions recommandees :

1. Ne pas traiter l'echec Codex comme un P0 tant que le build local passe.
2. Migrer `src/middleware.ts` vers la convention Next.js 16 `proxy.ts` avec export `proxy`.
3. Optionnel : definir `turbopack.root` dans `next.config.ts` seulement si le warning de racine apparait aussi hors Codex ou en CI.
4. Utiliser le build local/CI comme source de verite pour les tailles de routes et bundles.

Gain attendu :

- Suppression d'un warning/deprecated Next.js 16.
- Moins d'ambiguite entre probleme d'environnement et probleme applicatif.

### P0 - Corriger les erreurs lint qui bloquent React Compiler / Hooks

Constat :

- TypeScript passe, mais ESLint echoue.
- Les erreurs les plus couteuses ne sont pas seulement cosmetiques : elles signalent des patterns de rendu que React 19/Compiler ne peut pas optimiser.

Exemples critiques :

- `src/components/schema/Canvas.tsx` : acces/modification de `ref.current` pendant le render.
- `src/components/sidebar.tsx` : composant `NavLink` declare dans le render.
- `src/components/admin/MembresTable.tsx` : `useMemo` avec dependance `users` manquante, optimisation preservee impossible.
- `src/app/(dashboard)/planning/[planId]/page.tsx` : `load()` declenche depuis un effect avec setState.
- `src/components/admin/emails/RecipientPicker.tsx` : `setLoading(true)` synchrone dans un effect.
- `src/components/landing/hero/*` : plusieurs animations reinitialisent du state directement dans des effects.

Actions recommandees :

1. Corriger d'abord les erreurs React Compiler, avant de refactorer massivement.
2. Sortir les composants declares dans des composants parents.
3. Remplacer les derivations de state par du rendu derive ou `useMemo` correct.
4. Garder les effects pour synchroniser des systemes externes, pas pour recalculer du state local derivable.

Gain attendu :

- Moins de rendus en cascade.
- Meilleure compatibilite React 19.
- Base plus fiable pour supprimer du code sans casser subtilement le runtime.

### P1 - Reduire fortement la surface `'use client'`

Constat :

- 102 fichiers contiennent `'use client'`.
- Beaucoup de pages entieres du dashboard/admin sont client-side alors qu'elles lisent surtout Supabase puis affichent des listes.
- Cela force plus de JavaScript, plus d'hydration, et pousse des lectures de donnees vers le navigateur.

Pages candidates a redevenir Server Components :

- `src/app/(dashboard)/flashcards/page.tsx`
- `src/app/(dashboard)/fiches/page.tsx`
- `src/app/(dashboard)/schemas/page.tsx`
- `src/app/(dashboard)/timelines/page.tsx`
- `src/app/(dashboard)/exams/page.tsx`
- `src/app/(dashboard)/annales/page.tsx`
- `src/app/(dashboard)/planning/page.tsx`
- `src/app/(dashboard)/lacunes/page.tsx`
- `src/app/admin/affiliates/[id]/page.tsx`

Pattern cible :

- Page serveur : auth, requetes Supabase, tri initial, metadata.
- Composant client minimal : recherche locale, filtres, interactions, formulaires.
- Mutations : Server Actions quand l'action vient de l'UI.
- Route Handler seulement si l'endpoint est public, externe, webhook, upload/fichier, ou integration tierce.

Gain attendu :

- Reduction du JS initial.
- Moins de requetes client apres hydration.
- Moins de code `createClient()` cote navigateur.
- Simplification des routes API internes.

### P1 - Classer les 51 route handlers et en supprimer une partie

Constat :

- `src/app/api` contient 51 routes.
- Plusieurs endpoints sont appeles uniquement par des composants client internes.
- Next recommande les Server Actions pour les mutations declenchees par l'UI, et les Server Components pour les lectures directes.

Routes a garder probablement :

- `api/webhooks/stripe` : webhook externe.
- `api/auth/register` et `auth/callback` : auth / callback.
- `api/extract/pdf`, `api/extract/youtube`, `api/extract-image-text` : upload/extraction, potentiellement route handler utile.
- `api/pronote/*` : integration externe et contraintes session/QR.
- `api/affiliate/track` : tracking public depuis URL/cookie.
- `api/events/*` via rewrites PostHog dans `next.config.ts`.

Routes candidates a Server Actions ou lectures serveur :

- `api/billing/checkout`
- `api/billing/portal`
- `api/fsrs/stats`
- `api/fsrs/settings`
- `api/flashcards/[deckId]/due`
- `api/flashcards/[deckId]/review`
- `api/study-plans/*`
- `api/schemas/[schemaId]`
- `api/fiches/[ficheId]`
- `api/admin/emails/*` sauf besoin API explicite
- `api/admin/affiliates/*` sauf interface admin externe
- `api/socrate/sessions/*` si uniquement consomme par l'app
- `api/recall/sessions/*` si uniquement consomme par l'app

Approche recommandee :

1. Faire un tableau `route -> appelants -> type -> decision`.
2. Migrer d'abord les endpoints qui n'ont qu'un seul appelant client.
3. Supprimer les endpoints apres migration + test manuel du parcours.
4. Garder les routes qui manipulent fichiers, webhooks, API publiques ou services tiers.

Gain attendu :

- Moins de duplication auth/validation.
- Moins de code serveur expose en HTTP.
- Moins de fetch client.
- Meilleure coherence App Router.

### P1 - Supprimer les doublons et composants legacy de landing

Constat :

- La landing active importe :
  - `src/components/landing/hero/Hero.tsx`
  - `src/components/landing/nav/Nav.tsx`
  - `src/components/landing/features/Features.tsx`
- Les anciens composants racine ne ressortent pas comme importes :
  - `src/components/landing/Hero.tsx`
  - `src/components/landing/Features.tsx`
  - `src/components/landing/Nav.tsx`
  - `src/components/landing/NavClient.tsx`
  - `src/components/landing/CTA.tsx`
  - `src/components/landing/Testimonials.tsx`
  - `src/components/landing/Formats.tsx`
  - `src/components/landing/ChangelogNav.tsx`

Attention :

- `src/components/landing/Nav.tsx` re-exporte `NavClient`, mais les pages importent `landing/nav/Nav`, donc ce duo semble legacy.
- A valider par `rg` strict avant suppression.

Actions recommandees :

1. Supprimer les composants legacy non importes.
2. Retirer les styles legacy associes dans `globals.css` uniquement apres verification visuelle.
3. Garder `Pricing`, `FAQ`, `HowItWorks`, `Method`, `FinalCTA`, `Footer`, `SeoLinks` car ils sont encore importes par `src/app/page.tsx`.

Gain attendu :

- Suppression directe de code mort.
- Moins de confusion pendant les futures refactorisations UI.
- Moins de CSS de compatibilite.

### P1 - Revoir les providers globaux et les fonts dans `layout.tsx`

Constat :

- `src/app/layout.tsx` charge globalement :
  - `Inter`
  - `Instrument Serif`
  - `JetBrains Mono`
  - `DM Sans`
  - `Geist`
  - `Geist Mono`
- `design.md` indique que la landing v2 utilise surtout Geist + Geist Mono, tandis que les autres polices sont liees au legacy.
- Le layout racine enveloppe toute l'app avec `PostHogProvider`, `ThemeProvider`, `AffiliateTracker`, `Toaster`, Vercel Analytics et Speed Insights.

Risques :

- Fonts inutiles prechargees ou variables conservees pour des styles legacy.
- JS de tracking/theme disponible partout meme quand non necessaire.
- Le provider client a la racine augmente la surface de code partagee.

Actions recommandees :

1. Faire un inventaire CSS des variables de fonts reellement utilisees.
2. Deplacer les fonts par route group si possible : marketing, dashboard, admin.
3. Supprimer `Instrument Serif`, `JetBrains Mono`, `DM Sans` si seuls les styles legacy les gardent.
4. Scoper `AffiliateTracker` aux pages publiques/landing si le tracking d'affiliation n'a pas besoin de vivre dans tout le dashboard.
5. Evaluer si `ThemeProvider` doit etre global ou seulement dashboard/app privee.

Gain attendu :

- Moins de CSS/font metadata.
- Moins de JS global.
- Layout racine plus stable et plus simple.

### P1 - Corriger les patterns `next/link` et `next/image`

Constat lint :

- Liens internes avec `<a>` au lieu de `next/link` :
  - `src/app/global-error.tsx`
  - `src/components/landing/Footer.tsx`
  - `src/components/landing/features/Features.tsx`
  - `src/components/landing/nav/Nav.tsx`
- `<img>` force avec disable ESLint :
  - `src/app/(dashboard)/bac/client.tsx`
  - `src/components/image-upload-input.tsx`
  - `src/components/sidebar.tsx`

Actions recommandees :

1. Remplacer les liens internes par `Link`.
2. Remplacer les `<img>` par `Image` si dimensions connues.
3. Garder `<img>` uniquement pour previews locales blob/data URL si `next/image` n'est pas adapte, avec justification locale.
4. Auditer les `unoptimized` sur logos : utile si besoin, mais a justifier.

Gain attendu :

- Meilleure navigation client.
- Optimisation image plus coherente.
- Suppression de disables ESLint.

### P2 - Nettoyer les assets publics inutiles

Constat :

- Assets utilises :
  - `/logo.png`
  - `/studra-logo.png`
- Assets publics sans usage detecte dans `src` :
  - `public/file.svg`
  - `public/globe.svg`
  - `public/next.svg`
  - `public/vercel.svg`
  - `public/window.svg`

Actions recommandees :

1. Supprimer les SVG par defaut Next si aucune page/documentation ne les reference.
2. Verifier si `README.md` ou assets SEO externes les utilisent avant deletion.
3. Revoir le poids de `logo.png` et `studra-logo.png` : environ 158 KB et 196 KB, possiblement optimisables.

Gain attendu :

- Nettoyage simple.
- Moins de bruit dans `public`.
- Depot plus lisible.

### P2 - Remplacer les types `mock` par des types metier

Constat :

- `src/lib/admin/mock-data.ts` ne contient plus de mock, mais reste le module de types admin.
- `src/lib/lacunes/mock.ts` contient a la fois types et vraies donnees mock (`mockStats`, `mockCards`, `mockAnalysis`).
- Plusieurs composants importent des types depuis ces modules.

Actions recommandees :

1. Renommer `src/lib/admin/mock-data.ts` en `src/lib/admin/types.ts`.
2. Separer `src/lib/lacunes/types.ts` de `src/lib/lacunes/mock.ts`.
3. Supprimer les constantes mock si elles ne sont plus utilisees.
4. Mettre a jour les imports types uniquement.

Gain attendu :

- Suppression de donnees demo.
- Moins d'ambiguite entre production et mock.
- Types plus faciles a maintenir.

### P2 - Revoir les dependances lourdes et leur boundary serveur/client

Constat :

- Dependances lourdes ou sensibles :
  - `framer-motion`
  - `canvas`
  - `pdf-parse`
  - `openai`
  - `stripe`
  - `posthog-js`
  - `posthog-node`
  - `pawnote`
  - `jsqr`
  - `react-markdown`
  - `remark-gfm`
- `next.config.ts` externalise seulement `pdf-parse`, alors que `canvas` est aussi un package natif utilise dans `api/pronote/connect-qr`.

Actions recommandees :

1. Verifier si `canvas` doit etre ajoute a `serverExternalPackages`.
2. Garder `openai`, `stripe`, `resend`, `posthog-node`, `pawnote`, `pdf-parse`, `canvas` strictement cote serveur.
3. Garder `framer-motion` limite a la landing ou charger dynamiquement les sections animees sous le fold.
4. Si la landing doit optimiser FCP/LCP, envisager une version CSS-first de certaines animations au lieu de `framer-motion` partout.

Gain attendu :

- Moins de risque de bundling client accidentel.
- Moins de cout JS landing.
- Build serveur plus previsible.

### P2 - Rationaliser Supabase client vs serveur

Constat :

- Beaucoup de pages client importent `@/lib/supabase/client`.
- D'autres pages ont deja le bon pattern serveur avec `@/lib/supabase/server`.
- Le dashboard principal utilise deja `src/lib/dashboard/queries.ts`, ce qui est un bon modele.

Actions recommandees :

1. Generaliser des modules `queries.ts` serveur par domaine :
  - `flashcards/queries.ts`
  - `fiches/queries.ts`
  - `schemas/queries.ts`
  - `planning/queries.ts`
  - `admin/queries.ts` existe deja
2. Passer les donnees initiales aux composants client en props serialisables.
3. Convertir les `Date` en string ISO si elles traversent Server -> Client.
4. Garder Supabase client seulement pour auth realtime ou interactions explicitement navigateur.

Gain attendu :

- Moins de logique auth/requete dupliquee.
- Moins de fetch apres hydration.
- Meilleure securite des lectures.

### P2 - Auditer les caches Next.js

Constat :

- Aucun usage visible de `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife`.
- Les pages marketing/SEO/blog pourraient beneficier de cache explicite si les donnees sont stables.
- Les pages dashboard authentifiees doivent rester dynamiques.

Actions recommandees :

1. Ne pas ajouter de cache global avant d'avoir stabilise les Server Components.
2. Cacher uniquement les donnees publiques et stables : blog local, pages SEO, metadata.
3. Pour les requetes Supabase utilisateur, preferer dynamic rendering clair plutot que cache implicite ambigu.

Gain attendu :

- Moins de recalcul public.
- Pas de fuite de donnees user via cache mal place.

### P2 - Revoir les logs et instrumentation

Constat :

- Plusieurs `console.log(JSON.stringify(...))` existent dans les routes admin/email/unsubscribe/youtube.
- Les logs structures sont utiles, mais il faut distinguer debug, audit et erreurs.

Actions recommandees :

1. Centraliser un logger minimal serveur.
2. Supprimer ou conditionner les logs debug YouTube (`src/lib/youtube.ts`) si trop verbeux en production.
3. Garder les logs metier importants : unsubscribe, envoi email, webhook.

Gain attendu :

- Moins de bruit serveur.
- Diagnostic plus propre.

## Plan de refactor recommande

### Phase 1 - Rendre le socle mesurable

1. Confirmer le build vert sur l'environnement local/CI qui sert de reference.
2. Migrer `middleware` vers `proxy`.
3. Corriger les erreurs ESLint React Compiler/Hooks.
4. Recuperer le tableau de routes/bundles depuis un build local fiable.

Critere de succes :

- `npm run lint` OK.
- `npx tsc --noEmit` OK.
- `npm run build` OK sur local/CI.

### Phase 2 - Supprimer le code mort evident

1. Supprimer les composants landing legacy non importes.
2. Supprimer les SVG publics par defaut non utilises.
3. Separer `mock` et `types`.
4. Supprimer les disables ESLint devenus inutiles.

Critere de succes :

- `rg` ne trouve plus d'import vers les fichiers supprimes.
- Build OK.
- Verification visuelle landing + dashboard.

### Phase 3 - Reduire le JS client

1. Convertir les pages liste du dashboard en Server Components.
2. Extraire les filtres/recherche dans des client islands.
3. Migrer les endpoints internes simples vers Server Actions.
4. Supprimer les route handlers devenus inutiles.

Critere de succes :

- Moins de fichiers `'use client'`.
- Moins de `fetch('/api/...')` depuis composants client.
- Bundle client plus faible apres `next build`.

### Phase 4 - Optimiser landing et providers globaux

1. Scoper providers/tracking.
2. Retirer les fonts legacy.
3. Charger les animations lourdes sous le fold ou les simplifier.
4. Revoir `framer-motion` section par section.

Critere de succes :

- LCP/FCP meilleurs sur landing.
- JS initial plus faible.
- Aucun changement visuel majeur non souhaite.

## Backlog de suppressions candidates

Validation obligatoire par `rg` + build avant suppression.

- `src/components/landing/Hero.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Nav.tsx`
- `src/components/landing/NavClient.tsx`
- `src/components/landing/CTA.tsx`
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/Formats.tsx`
- `src/components/landing/ChangelogNav.tsx`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- constantes `mockStats`, `mockCards`, `mockAnalysis` si non utilisees apres extraction des types

## Risques a surveiller

- Ne pas migrer toutes les routes API vers Server Actions : les webhooks, uploads, callbacks et APIs publiques restent des Route Handlers.
- Ne pas cacher les donnees authentifiees sans strategie claire.
- Ne pas supprimer les styles legacy avant validation des pages blog, changelog, CGU/CGV/confidentialite.
- Ne pas supprimer les providers analytics sans verifier les besoins produit : attribution affiliate, signup OAuth, PostHog pageviews.
- Ne pas remplacer les `<img>` blob preview par `next/image` si cela complexifie inutilement les previews locales.

## Conclusion

Les plus gros gains ne viendront pas d'une minification ponctuelle, mais de trois chantiers :

1. remettre le lint React/Next au vert pour refactorer sur une base mesurable ;
2. reduire drastiquement les pages et providers client ;
3. supprimer les doublons legacy et les route handlers internes remplaces par Server Components / Server Actions.

La codebase est type-checkee et le build local du mainteneur passe. En revanche, le lint doit etre remis au vert avant toute suppression massive, sinon il sera plus difficile de mesurer les gains et d'isoler les regressions.
