# Audit performance - Landing page Studra

Date : 2026-05-16
Perimetre : `src/app/page.tsx` et ses dependances, `src/app/layout.tsx` et `src/app/providers.tsx`
Cibles : Desktop ET mobile

## 0. Metriques de reference (Vercel Speed Insights)

Source : captures Vercel Speed Insights fournies, environnement Production, Last 7 Days, percentile P75.

| Cible | RES | FCP | LCP | INP | CLS | FID | TTFB |
|---|---:|---:|---:|---:|---:|---:|---:|
| Desktop | 60 | 6.04 s | 5.39 s | 112 ms | 0 | 6 ms | 1.55 s |
| Mobile | 71 | 4.13 s | 4.24 s | 144 ms | 0 | 22 ms | 0.55 s |

Lecture initiale :

- Desktop : LCP et FCP sont les metriques les plus degradees. TTFB est aussi mauvais a 1.55 s.
- Mobile : LCP et FCP sont aussi rouges. INP reste bon, meme s'il est plus lent que desktop.
- CLS : excellent sur les deux cibles.
- Ecart notable : desktop est plus lent que mobile sur FCP/LCP et TTFB. Ce n'est pas le profil classique "mobile plus lent a cause du CPU/reseau"; cela pointe plutot vers des visites desktop servies avec un chemin serveur plus lent, un echantillon different, ou une route dynamique/non prerendue.

## 1. Priorites de l'audit

Priorite 1 : expliquer LCP/FCP sur desktop et mobile.

Les scores LCP/FCP sont catastrophiques alors que CLS est nul et INP est vert. L'audit cible donc d'abord le chemin critique : rendu serveur, shell statique, polices, CSS, ressources au-dessus de la ligne de flottaison.

Priorite 2 : expliquer le TTFB desktop eleve.

`TTFB = 1.55 s` sur desktop est assez haut pour impacter directement FCP et LCP. La landing lit l'utilisateur via Supabase/cookies dans plusieurs Server Components, ce qui rend tres probable un rendu dynamique ou partiellement dynamique.

Priorite secondaire : verifier le JS client.

INP est bon aujourd'hui, mais le root layout charge PostHog, Supabase client, ThemeContext, Sonner, Analytics et SpeedInsights sur la landing. Ce n'est pas la cause principale visible dans les metriques actuelles, mais cela reste un risque TBT/INP et un cout de chargement.

## 2. Cartographie de la landing

### 2.1 Arbre de dependance

Entrees globales :

- `src/app/layout.tsx` (115 lignes, Server Component) importe `next/font/google`, `./globals.css`, `sonner`, `@vercel/analytics/next`, `@vercel/speed-insights/next`, `ThemeProvider`, `PostHogProvider` (`src/app/layout.tsx:1-8`).
- `src/app/providers.tsx` (46 lignes, Client Component) importe `posthog-js`, `posthog-js/react`, `react`, `next/navigation`, `@/lib/supabase/client` (`src/app/providers.tsx:1-8`).
- `src/app/page.tsx` (64 lignes, Server Component) importe tous les blocs de landing (`src/app/page.tsx:1-15`).

Arbre landing :

| Fichier | Lignes | Type | Imports tiers / locaux notables |
|---|---:|---|---|
| `src/app/page.tsx` | 64 | Server | `react/Suspense`, composants landing |
| `src/components/landing/Nav.tsx` | 6 | Server async | `getUser`, `NavClient` |
| `src/components/landing/NavClient.tsx` | 98 | Client | `next/link`, `next/image`, `useState` |
| `src/components/landing/Hero.tsx` | 178 | Server async | `next/link`, `getUser` |
| `src/components/landing/LandingTracker.tsx` | 13 | Client | `useEffect`, `useSearchParams`, `trackLandingView` |
| `src/lib/analytics.ts` | 284 | Client quand importe par `LandingTracker` | `posthog-js` |
| `src/components/landing/Formats.tsx` | 186 | Server | aucun import tiers |
| `src/components/landing/Features.tsx` | 158 | Server | aucun import tiers |
| `src/components/landing/HowItWorks.tsx` | 26 | Server | aucun import tiers |
| `src/components/landing/Testimonials.tsx` | 52 | Server | aucun import tiers |
| `src/components/landing/SeoLinks.tsx` | 50 | Server | `next/link` |
| `src/components/landing/Pricing.tsx` | 117 | Server async | `next/link`, `getUser`, `createClient` Supabase server |
| `src/components/landing/FAQ.tsx` | 50 | Server | `details/summary` natif |
| `src/components/landing/CTA.tsx` | 24 | Server | `next/link` |
| `src/components/landing/Footer.tsx` | 48 | Server | `next/link`, `next/image` |
| `src/components/landing/LandingJsonLd.tsx` | 120 | Server | balises `<script type="application/ld+json">` natives |
| `src/contexts/ThemeContext.tsx` | 37 | Client | `createContext`, `useEffect`, `useState`, `localStorage` |
| `src/lib/supabase/get-user.ts` | 8 | Server | `react/cache`, Supabase server |
| `src/lib/supabase/server.ts` | 27 | Server | `@supabase/ssr`, `cookies()` |
| `src/lib/supabase/client.ts` | 8 | Client | `@supabase/ssr/createBrowserClient` |
| `src/app/globals.css` | 458 | CSS global | Tailwind, typography plugin, theme global, landing CSS |

### 2.2 Server vs Client

La page `src/app/page.tsx` est bien un Server Component : pas de `'use client'` en tete (`src/app/page.tsx:42-66`). C'est positif pour FCP/LCP.

Client Components presents sur la landing :

- `NavClient` pour le menu mobile (`src/components/landing/NavClient.tsx:1-16`).
- `LandingTracker` pour tracker `landing_viewed` via PostHog (`src/components/landing/LandingTracker.tsx:1-13`).
- `PostHogProvider` global dans le root layout (`src/app/providers.tsx:1-53`).
- `ThemeProvider` global dans le root layout (`src/contexts/ThemeContext.tsx:1-37`).
- `Toaster` Sonner global dans le root layout (`src/app/layout.tsx:116`).
- Vercel `Analytics` et `SpeedInsights` globaux (`src/app/layout.tsx:117-118`).

Point important : le root layout reste Server Component, mais il enveloppe toute l'app dans deux providers client (`src/app/layout.tsx:111-115`). Selon les docs Next lues localement, les providers clients doivent etre rendus aussi profond que possible pour reduire le JS envoye et faciliter l'optimisation des parties statiques.

### 2.3 Strategie de rendu (SSG/SSR/ISR)

Aucun `export const dynamic` ou `export const revalidate` dans `src/app/page.tsx`, `layout.tsx` ou les composants landing audites.

Mais la landing lit des cookies via Supabase :

- `Nav` appelle `getUser()` (`src/components/landing/Nav.tsx:4-6`).
- `Hero` appelle `getUser()` (`src/components/landing/Hero.tsx:4-6`).
- `Pricing` appelle `getUser()` puis potentiellement une requete `profiles` (`src/components/landing/Pricing.tsx:5-16`).
- `getUser()` appelle `createClient()` server (`src/lib/supabase/get-user.ts:4-7`).
- `createClient()` server lit `cookies()` (`src/lib/supabase/server.ts:1-5`).

Cause probable P0 : la route `/` est personnalisee par cookies et ne peut probablement pas etre entierement prerendue en HTML statique. Le TTFB desktop a 1.55 s est coherent avec ce pattern. A confirmer avec le resume de `next build` et/ou le header/cache behavior en production.

Le `Suspense` autour de `Pricing` (`src/app/page.tsx:57-59`) limite une partie du cout, mais `Nav` et `Hero` restent au-dessus de la ligne de flottaison et appellent `getUser()` sans boundary locale.

## 3. Audit ressources

### 3.1 Images

Images trouvees sur la landing :

| Fichier source | Usage | Props | Poids source | Dimensions source | Commentaire |
|---|---|---|---:|---:|---|
| `/logo.png` | nav | `Image src="/logo.png" width={36} height={36}` (`src/components/landing/NavClient.tsx:27`) | 197 281 o | 444x504 | Tres lourd pour un rendu 36x36. |
| `/logo.png` | footer | `Image src="/logo.png" width={36} height={36}` (`src/components/landing/Footer.tsx:10`) | 197 281 o | 444x504 | Meme source, sous la ligne de flottaison. |

Aucune image hero raster n'est presente. Le LCP probable est donc un element texte du hero (`h1`) ou le gros mockup HTML/CSS de produit (`src/components/landing/Hero.tsx:17-36`, `src/components/landing/Hero.tsx:41-195`), pas une balise `<Image>`.

Problemes concrets :

- `logo.png` pese presque 200 KB pour un affichage 36x36. Meme si Next sert un format optimise, le fichier source est disproportionne. Impact : LCP/FCP faible a moyen, surtout si le logo est charge tot dans la nav.
- Pas de `priority` sur le logo nav. Ce n'est pas forcement a ajouter : le logo n'est probablement pas le LCP. A investiguer via Lighthouse element LCP.
- Pas de `sizes` necessaire ici car l'image a `width/height` fixes.

### 3.2 Polices

Polices declarees globalement dans `src/app/layout.tsx` :

| Police | Ligne | Poids/styles | Portee | Risque |
|---|---:|---|---|---|
| `Inter` | `src/app/layout.tsx:10` | variable, `latin` | classe body | chargee partout |
| `Instrument_Serif` | `src/app/layout.tsx:12-17` | weight `400`, styles normal+italic | variable `--font-serif` | utilisee abondamment sur landing |
| `JetBrains_Mono` | `src/app/layout.tsx:19-23` | weights `400/500/600` | variable `--font-mono` | utilisee pour petits labels |
| `DM_Sans` | `src/app/layout.tsx:25-29` | weights `400/500/600` | variable `--font-dm-sans` | declaree dans theme CSS |
| `DM_Serif_Display` | `src/app/layout.tsx:31-36` | weight `400`, styles normal+italic | variable `--font-dm-serif` | pas vu comme classe landing directe |

Le body applique toutes les variables et `inter.className` (`src/app/layout.tsx:107-109`). Cinq familles dans le root layout, dont plusieurs poids/styles, sont beaucoup pour une landing dont le LCP semble texte.

Impact probable :

- LCP/FCP : eleve a moyen. Le hero utilise `font-serif` sur le H1 (`src/components/landing/Hero.tsx:17`) et la CSS mappe `--font-serif` vers Instrument Serif (`src/app/globals.css:21`). Si cette police est bloquante pour le rendu visible ou arrive tard, le LCP texte peut souffrir.
- CLS : faible aujourd'hui, car CLS mesure 0 et `next/font` limite les shifts.
- Desktop/mobile : mobile et desktop touches. Les polices aggravent surtout FCP/LCP sur connexions lentes et premieres visites.

Polices passageres clandestines probables :

- `DM_Serif_Display` est declaree globalement mais je n'ai pas trouve d'usage landing direct de `--font-dm-serif`.
- `Inter` et `DM_Sans` coexistent alors que la landing utilise `font-serif`, `font-mono` et du sans global. A investiguer via CSS final et bundle font.

### 3.3 CSS

`src/app/globals.css` fait 16 422 octets source et 458 lignes.

Imports CSS :

- `@import "tailwindcss";` (`src/app/globals.css:1`)
- `@plugin "@tailwindcss/typography";` (`src/app/globals.css:2`)

Pas d'import CSS externe type Google Fonts/animate.css.

Points couteux pour FCP/LCP/rendering :

- Hero background radial + blur : `.hero-bg::before` utilise un radial gradient 700x700 avec `filter: blur(20px)` (`src/app/globals.css:106-117`).
- Grille hero en mask-image : `.hero-bg::after` utilise deux gradients + `mask-image` (`src/app/globals.css:118-128`).
- Nav sticky avec `backdrop-blur-[14px]` (`src/components/landing/NavClient.tsx:19`).
- Nombreux grands gradients/shadows dans le hero mockup (`src/components/landing/Hero.tsx:43`, `src/components/landing/Hero.tsx:147-149`).
- Animation infinie sur la carte active (`src/app/globals.css:96-103`, utilisee par `src/components/landing/Hero.tsx:126`).

Impact probable :

- FCP/LCP : moyen a eleve, car le premier viewport est entierement compose de texte + CSS complexe + fonts.
- INP/TBT : faible a moyen. CSS animations infinies et backdrop blur peuvent charger le compositor/GPU, mais l'INP actuel reste vert.

### 3.4 Scripts tiers

Scripts / SDKs charges sur la landing :

| Script/SDK | Fichier | Chargement observe | Impact |
|---|---|---|---|
| PostHog browser SDK | `src/app/providers.tsx:3-4` | import client global + `posthog.init` en `useEffect` (`src/app/providers.tsx:27-33`) | INP/TBT moyen, LCP/FCP faible a moyen |
| PostHog pageview manuel | `src/app/providers.tsx:10-24` | `usePathname`, `useSearchParams`, `posthog.capture` | INP faible a moyen |
| Landing event | `src/components/landing/LandingTracker.tsx:7-13` | `trackLandingView`, importe `src/lib/analytics.ts` qui importe PostHog (`src/lib/analytics.ts:1`) | duplication logique tracking |
| Supabase browser client | `src/app/providers.tsx:35-42` | `getSession()` au mount pour identifier l'utilisateur | TBT/INP moyen, requete client inutile pour visiteurs anonymes |
| Sonner Toaster | `src/app/layout.tsx:4`, `src/app/layout.tsx:116` | global sur toutes les pages | JS client faible a moyen |
| Vercel Analytics | `src/app/layout.tsx:5`, `src/app/layout.tsx:117` | composant global | faible |
| Vercel SpeedInsights | `src/app/layout.tsx:6`, `src/app/layout.tsx:118` | composant global | faible |

Mesures locales non minifiees :

- `posthog-js/dist/main.js` : 193 KB non minifie/local; autres builds vont jusqu'a 400+ KB non minifies. Estimation minifie-gzip a confirmer via bundle analyzer.
- `sonner/dist/index.mjs` : 65 KB non minifie/local + `styles.css` 17 KB.
- Vercel Analytics/SpeedInsights next dist sont petits localement, mais le cout final exact doit etre confirme par bundle analyzer.

Stripe :

- Le package `stripe` est present (`package.json:31`) mais aucun `Stripe.js` client n'est charge sur la landing.
- `src/lib/stripe.ts` est serveur et n'apparait pas dans l'arbre de la landing. Pas de probleme Stripe sur `/`.

### 3.5 JS client (estimation)

Client Components de l'arbre :

| Component | Lignes | Imports tiers | Risque |
|---|---:|---|---|
| `src/app/providers.tsx` | 46 | `posthog-js`, `posthog-js/react`, `next/navigation`, Supabase browser | Moyen/eleve pour JS global |
| `src/contexts/ThemeContext.tsx` | 37 | React state/effect | Faible, mais global |
| `src/components/landing/NavClient.tsx` | 98 | `next/link`, `next/image`, `useState` | Faible |
| `src/components/landing/LandingTracker.tsx` | 13 | `next/navigation`, `posthog-js` via analytics | Moyen par dependance PostHog |
| `sonner` Toaster | externe | `sonner` | Faible/moyen |
| `@vercel/analytics`, `@vercel/speed-insights` | externe | Vercel packages | Faible |

Pas d'import `lucide-react` dans l'arbre landing. Pas de `framer-motion`, lottie, GSAP ou IntersectionObserver dans la landing.

Import barrel a surveiller :

- `import posthog from 'posthog-js'` (`src/app/providers.tsx:3`, `src/lib/analytics.ts:1`) embarque le SDK browser. Ce n'est pas un barrel tree-shakeable classique; le cout vient du SDK lui-meme.
- `sonner` est importe globalement (`src/app/layout.tsx:4`) meme si la landing n'affiche pas de toast.

## 4. Audit patterns de rendu

### 4.1 Hydration

La landing n'est pas hydratee en bloc, ce qui est positif. Les sections `Formats`, `Features`, `HowItWorks`, `Testimonials`, `SeoLinks`, `FAQ`, `CTA`, `Footer` sont Server Components statiques.

Hydration/cout client inutiles ou discutables :

- `PostHogProvider` wrappe toute l'app (`src/app/layout.tsx:111-115`).
- `ThemeProvider` wrappe toute l'app et lit `localStorage` au mount (`src/contexts/ThemeContext.tsx:17-20`).
- `Toaster` est global alors que la landing n'en a pas besoin (`src/app/layout.tsx:116`).
- `LandingTracker` importe `posthog-js` via `src/lib/analytics.ts` en plus du provider global (`src/components/landing/LandingTracker.tsx:5`, `src/lib/analytics.ts:1`).

### 4.2 Animations et interactions

Animations/interactions au-dessus de la ligne de flottaison :

- Carte hero flottante infinie : `.card-floating` (`src/app/globals.css:96-103`) utilisee dans le hero (`src/components/landing/Hero.tsx:126`).
- Nav mobile avec `transition-all` et `max-height` (`src/components/landing/NavClient.tsx:71-73`).
- `backdrop-blur-[14px]` sur la nav sticky (`src/components/landing/NavClient.tsx:19`).
- Hero background avec `filter: blur(20px)` (`src/app/globals.css:115`).

Impact :

- LCP/FCP : surtout via cout de peinture CSS au premier rendu.
- INP : pas prioritaire vu INP vert, mais a surveiller sur mobiles bas de gamme.
- CLS : pas de signal terrain; CLS = 0.

### 4.3 Fetches au mount

Fetch/requetes client au mount :

- `PostHogProvider` initialise PostHog et appelle `supabase.auth.getSession()` au mount (`src/app/providers.tsx:27-42`).
- `PostHogPageView` capture chaque pageview en `useEffect` (`src/app/providers.tsx:14-21`).
- `LandingTracker` capture `landing_viewed` en `useEffect` (`src/components/landing/LandingTracker.tsx:10-13`).

Il n'y a pas de fetch client de contenu landing. Le contenu principal est rendu serveur.

## 5. Ecarts desktop vs mobile

Le cas observe est inhabituel : desktop est plus lent que mobile en FCP/LCP et TTFB.

Explications probables :

- Echantillon RUM different : les visiteurs desktop de `/` ont peut-etre plus souvent des cookies/session, ce qui declenche le chemin `getUser()` + requete profile, alors que mobile a plus de visiteurs anonymes.
- TTFB desktop a 1.55 s : le rendu serveur dynamique/personnalise peut dominer LCP/FCP, independamment de la puissance CPU.
- Hero CSS et polices touchent les deux cibles, mais n'expliquent pas a eux seuls pourquoi desktop serait pire que mobile.
- INP mobile est plus lent que desktop (144 ms vs 112 ms), ce qui est normal avec CPU mobile plus faible, mais il reste sous 200 ms. Les SDKs client ne sont pas la priorite immediate.

## 6. Causes probables des mauvaises perfs

| Cause | Metrique impactee | Cible | Impact estime | Effort |
|---|---|---|---|---|
| Landing personnalisee par `getUser()`/Supabase/cookies dans `Nav`, `Hero`, `Pricing` | TTFB, FCP, LCP | Les deux, signal fort desktop | Eleve | M |
| `Pricing` fait une requete Supabase `profiles` sur la landing pour les users connectes | TTFB, LCP | Surtout visiteurs connectes | Eleve | S/M |
| Cinq polices Google declarees globalement dans root layout | FCP, LCP | Les deux | Moyen/eleve | S/M |
| Hero au-dessus de la ligne de flottaison tres lourd en CSS pur : mockup HTML massif, gradients, shadows, blur | FCP, LCP | Les deux, surtout mobile bas de gamme | Moyen/eleve | M |
| PostHog + Supabase browser + pageview + landing event charges globalement | TBT, INP, FCP secondaire | Les deux, surtout mobile | Moyen | M |
| Sonner Toaster global sur landing | JS client, TBT secondaire | Les deux | Faible/moyen | S |
| `logo.png` 197 KB source pour affichage 36x36 | FCP/LCP secondaire | Les deux | Faible/moyen | S |
| `backdrop-blur` nav + `filter: blur` hero | Paint/rendering, LCP | Les deux | Moyen | S |
| JSON-LD inline volumineux x4 | HTML initial, FCP secondaire | Les deux | Faible | S |
| CSS global contient landing + dashboard theme overrides dans un seul fichier | CSS parse, FCP secondaire | Les deux | Faible/moyen | M |

## 7. Recommandations

### 7.1 Top 5 ROI

1. Sortir la personnalisation auth du premier viewport public.
   - Cible : TTFB, FCP, LCP.
   - Concret : eviter `getUser()` dans `Nav` et `Hero` pour `/`, ou isoler la partie auth sous Suspense avec fallback statique, ou utiliser une nav publique non personnalisee.
   - Justification : `Nav`, `Hero`, `Pricing` lisent `cookies()` via Supabase (`src/components/landing/Nav.tsx:4-6`, `src/components/landing/Hero.tsx:4-6`, `src/components/landing/Pricing.tsx:5-16`, `src/lib/supabase/server.ts:5`).

2. Rendre `Pricing` statique pour les visiteurs publics.
   - Cible : TTFB, LCP indirect.
   - Concret : afficher des CTA publics statiques sur la landing, et gerer l'etat plan/connecte apres clic ou dans l'app.
   - Justification : la requete `profiles.select('plan')` ne sert qu'a adapter deux CTA (`src/components/landing/Pricing.tsx:10-29`).

3. Reduire les polices globales.
   - Cible : FCP, LCP.
   - Concret : garder uniquement les familles necessaires a la landing dans le root public, deplacer les polices dashboard dans un layout dashboard, supprimer les styles/poids non utilises.
   - Justification : cinq familles chargees depuis `src/app/layout.tsx:2-36`.

4. Retarder ou retirer PostHog/Supabase browser de la landing.
   - Cible : TBT, INP, FCP secondaire.
   - Concret : ne charger PostHog qu'apres idle/consent ou sur routes app, supprimer `supabase.auth.getSession()` global au mount pour visiteurs publics.
   - Justification : `posthog.init` + `supabase.auth.getSession()` sont dans le provider global (`src/app/providers.tsx:27-42`).

5. Simplifier le hero CSS au premier viewport.
   - Cible : FCP, LCP.
   - Concret : reduire `filter: blur`, `backdrop-blur`, shadows lourdes et animation infinie au-dessus de la ligne de flottaison; tester en A/B Lighthouse.
   - Justification : hero background blur (`src/app/globals.css:106-117`), nav blur (`src/components/landing/NavClient.tsx:19`), mockup lourd (`src/components/landing/Hero.tsx:41-195`).

### 7.2 Quick wins (< 30 min)

- Remplacer `public/logo.png` par un asset beaucoup plus petit pour un affichage 36x36, ou SVG optimise. Gain attendu : FCP/LCP secondaire.
- Supprimer ou deplacer `DM_Serif_Display` si non utilise sur la landing. Gain attendu : FCP/LCP.
- Supprimer les poids inutiles de `JetBrains_Mono` et `DM_Sans` si un seul poids suffit sur la landing. Gain attendu : FCP/LCP.
- Desactiver l'animation `.card-floating` au chargement initial ou via `prefers-reduced-motion`. Gain attendu : paint/rendering.
- Remplacer `backdrop-blur-[14px]` de la nav par un fond opaque simple pour tester. Gain attendu : LCP/rendering.
- Retirer le `supabase.auth.getSession()` du provider global et le reserver aux routes authentifiees. Gain attendu : TBT/INP et reseau client.

### 7.3 Decisions architecturales

- Creer un layout public distinct de l'app authentifiee.
  - Gain : evite PostHog/Supabase/Toaster/theme dashboard sur la landing.
  - Trade-off : un peu de duplication layout/nav, mais separation plus claire public vs app.

- Accepter une landing publique non personnalisee.
  - Gain : route `/` prerenderable, TTFB/FCP/LCP potentiellement bien meilleurs.
  - Trade-off : un utilisateur connecte verra peut-etre "Commencer" au lieu de "Acceder a l'application" jusqu'au clic ou jusqu'a une hydratation secondaire.

- Deplacer le tracking landing hors du chemin critique.
  - Gain : moins de JS et moins de work au mount.
  - Trade-off : moins de precision sur les pageviews tres courts si le tracking est lazy/idle.

- Segmenter les polices par layout.
  - Gain : la landing ne paie pas les polices du dashboard, et inversement.
  - Trade-off : demande de verifier les regressions visuelles.

## 8. Limites de l'audit

- Aucun `npm run build`, Lighthouse local, bundle analyzer ou profiling Chrome n'a ete lance, conforme aux contraintes.
- Les poids JS cites depuis `node_modules` sont des tailles locales non minifiees/non gzippees. Les tailles finales doivent etre confirmees via analyzer.
- L'element LCP exact n'a pas ete mesure. Hypothese : texte hero ou mockup hero CSS, car aucune image hero n'existe.
- Le statut SSG/SSR exact de `/` doit etre confirme par le resume de build Next/Vercel. Le code indique fortement une dependance runtime via `cookies()`, mais le rapport ne remplace pas une mesure de build.
- Les captures Speed Insights ne donnent pas TBT. INP est bon, donc l'analyse JS client reste secondaire.
- Les ecarts desktop/mobile peuvent etre biaises par la composition de l'echantillon RUM.

## 9. Commandes de mesure a lancer par Gael

```bash
# Confirmer si / est statique, dynamique, ou partiellement prerendue
npm run build
```

```bash
# Bundle analyzer, a ajouter selon la config choisie
ANALYZE=true npm run build
```

```bash
# Lighthouse mobile
npx lighthouse https://studra.fr/ --preset=desktop --view
npx lighthouse https://studra.fr/ --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --view
```

```bash
# Identifier l'element LCP et les requetes lentes
# Chrome DevTools > Performance > record reload
# Chrome DevTools > Network > disable cache > preserve log > filtrer fonts/img/script
```

```bash
# Verifier les assets servis et leur cache
curl -I https://studra.fr/
curl -I https://studra.fr/logo.png
```

```bash
# Comparer avec et sans cookies/session
# 1. Fenetre navigation privee
# 2. Session connectee
# 3. Lighthouse sur les deux profils
```
