# Audit Next.js best practices — Studra

Date : 2026-05-16
Référentiel utilisé : skill `next-best-practices` (Next.js 16+, React 19)

---

## 1. Inventaire du repo

### Versions confirmées (`package.json`)

| Package | Version |
|---------|---------|
| `next` | 16.2.2 |
| `react` / `react-dom` | 19.2.4 |
| `typescript` | ^5 |
| `tailwindcss` | ^4 |
| `@supabase/ssr` | ^0.10.0 |
| `@supabase/supabase-js` | ^2.101.1 |
| `@xyflow/react` | ^12.10.2 (déclaré mais non importé directement) |
| `stripe` | ^22.0.0 |
| `resend` | ^6.11.0 |
| `openai` | ^6.33.0 |
| `ts-fsrs` | ^5.3.2 |
| `pdf-parse` | ^1.1.1 |

### Arborescence `app/` (3 niveaux)

```
app/
├── (auth)/                    # Route group — login, register
│   ├── layout.tsx
│   ├── login/layout.tsx + page.tsx
│   └── register/layout.tsx + page.tsx
├── (dashboard)/               # Route group — app authentifiée
│   ├── layout.tsx
│   ├── annales/, billing/, dashboard/, exams/, fiches/
│   ├── flashcards/, lacunes/, planning/, recall/
│   ├── schemas/, settings/, socrate/, timelines/, upgrade/
│   └── [chaque segment] → page.tsx, parfois [id]/page.tsx, new/page.tsx
├── (seo)/                     # Route group — landing SEO
│   ├── layout.tsx
│   ├── examen-blanc-ia/page.tsx + opengraph-image.tsx
│   ├── fiches-de-revision-ia/page.tsx + opengraph-image.tsx
│   ├── flashcards-ia/page.tsx + opengraph-image.tsx
│   └── repetition-espacee/page.tsx + opengraph-image.tsx
├── admin/                     # Backoffice (non groupé)
│   ├── emails/, generations/, paiements/, settings/
│   └── page.tsx
├── api/                       # 33 route handlers
│   ├── admin/emails/ (campaigns, generate, recipients, send)
│   ├── analyze/lacunes/, auth/register/, billing/checkout+portal
│   ├── exams/[examId]/submit/, extract/pdf+youtube/
│   ├── fiches/[ficheId]/, flashcards/[deckId]/due+review/
│   ├── fsrs/settings+stats/, generate/* (8 routes)
│   ├── recall/sessions/, schemas/[schemaId]/, socrate/sessions/
│   ├── study-plans/, unsubscribe/, webhooks/stripe/
│   └── extract-image-text/
├── auth/callback/route.ts
├── blog/[slug]/page.tsx + blog/page.tsx
├── cgu/, cgv/, changelog/, confidentialite/
├── unsubscribe/
├── globals.css
├── layout.tsx                 # Root layout
├── opengraph-image.tsx        # OG image racine
├── page.tsx                   # Landing page
├── providers.tsx              # PostHog provider
├── robots.ts
└── sitemap.ts
```

### Fichiers `'use client'`

37 fichiers. Majorité : pages dashboard (`annales`, `exams`, `fiches`, `flashcards`, `lacunes`, `planning`, `recall`, `schemas`, `settings/revision`, `socrate`, `timelines`), composants UI interactifs (`sidebar`, `dashboard-shell`, `checkout-button`, etc.).

### Fichiers `'use server'`

Aucun.

### Route handlers (`route.ts`)

33 fichiers dans `app/api/**`. Voir liste complète ci-dessus.

### Fichiers spéciaux

| Fichier | Présent ? |
|---------|-----------|
| `error.tsx` | Absent (aucun niveau) |
| `global-error.tsx` | Absent |
| `not-found.tsx` | Absent |
| `loading.tsx` | Absent (aucun niveau) |
| `forbidden.tsx` | Absent |
| `unauthorized.tsx` | Absent |
| `sitemap.ts` | Présent |
| `robots.ts` | Présent |
| `manifest.ts` | Absent |
| `opengraph-image.tsx` | Présent (racine + 4 pages SEO) |
| `icon.png` + `apple-icon.png` | Présents |

### Middleware

`src/middleware.ts` — export `middleware()` (syntaxe Next.js 14-15, pas encore renommé en `proxy.ts`).

### Runtime par route

- Par défaut : Node.js (aucun `export const runtime` dans les pages)
- `app/opengraph-image.tsx` : `export const runtime = 'edge'`
- `app/api/admin/emails/*` (5 fichiers) : `export const runtime = 'nodejs'` (explicite mais redondant)
- `app/api/unsubscribe/route.ts` : `export const runtime = 'nodejs'` (idem)

---

## 2. Écarts identifiés

### 2.1 File conventions

---

#### [File conventions] — `middleware.ts` non renommé en `proxy.ts` (Next.js 16+)

**Fichier :** `src/middleware.ts`

**Règle du référentiel :** "Next.js 16+: `proxy.ts` — Renamed for clarity - same capabilities, different names. Migration: Run `npx @next/codemod@latest upgrade` to auto-rename."

**Code actuel :**
```ts
// src/middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
export const config = { matcher: [...] }
```

**Risque :** Next.js peut déprécier puis ignorer `middleware.ts` dans une future version mineure. Pour l'instant Next.js 16.2.2 tolère les deux, mais le projet n'est pas aligné sur la convention officielle de la version utilisée.

**Priorité :** P2 (conformité / dette technique).

**Effort estimé :** S — migration automatique via `npx @next/codemod@latest upgrade`.

---

### 2.2 RSC boundaries

Aucun écart détecté.

- Aucun composant Client (`'use client'`) n'est une `async function` en tant que composant racine exporté.
- Les fonctions `async` dans les Client Components sont toutes des gestionnaires d'événements (`handleLogin`, `handleGenerate`, etc.) ou des fonctions locales dans `useEffect` — valide.
- Aucune prop `Date`, `Map`, `Set` ou instance de classe passée d'un Server Component vers un Client Component. Les données Supabase sont du JSON sérialisable.
- `SchemaEditorClient.tsx` passe `initialData: SchemaData` (plain object) au SchemaEditor — conforme.

---

### 2.3 Async patterns

Aucun écart détecté.

Tous les `params` dynamiques sont typés `Promise<{ ... }>` et awaités correctement dans pages, layouts et route handlers. Exemples vérifiés : `fiches/[ficheId]/page.tsx`, `flashcards/[deckId]/page.tsx`, `schemas/[schemaId]/page.tsx`, `blog/[slug]/page.tsx`, `exams/[examId]/submit/route.ts`, `fiches/[ficheId]/route.ts`.

`cookies()` est awaité dans `lib/supabase/server.ts`. Conforme.

---

### 2.4 Runtime selection

---

#### [Runtime selection] — `runtime = 'edge'` sur l'OG image racine

**Fichier :** `src/app/opengraph-image.tsx` (ligne 3)

**Règle du référentiel :** "Avoid Edge runtime — Use default Node.js runtime" (section Metadata & OG Images). "No `runtime = 'edge'` on OG images."

**Code actuel :**
```tsx
export const runtime = 'edge'
export const alt = "Studra – Révision intelligente avec l'IA"
export const size = { width: 1200, height: 630 }
```

**Risque :** Le runtime Edge n'a pas accès à `fs` ni à `crypto` complet. Si des polices locales ou des assets disque sont ajoutés à l'OG image, ça cassera silencieusement en prod. Le référentiel déconseille explicitement ce pattern.

**Priorité :** P1 (risque de régression à l'ajout d'une font locale).

**Effort estimé :** S — supprimer la ligne `export const runtime = 'edge'`.

---

### 2.5 Directives

Aucun écart détecté.

- `'use client'` correctement en tête de fichier dans tous les composants interactifs.
- `'use server'` absent — les mutations passent toutes par des Route Handlers (choix architectural valide).
- `'use cache'` non utilisé — cohérent avec l'absence de `cacheComponents: true` dans `next.config.ts`.

---

### 2.6 Functions

Aucun écart détecté.

- Navigation interne : `next/link` utilisé partout. Aucun `<a href="/chemin-interne">` détecté.
- `useRouter`, `usePathname`, `useSearchParams`, `useParams` importés depuis `next/navigation`.
- `generateStaticParams` présent uniquement dans `blog/[slug]/page.tsx` (articles statiques).
- `generateMetadata` utilisé correctement dans `blog/[slug]/page.tsx` avec `await params`.

---

### 2.7 Error handling

---

#### [Error handling] — Absence de `error.tsx` à tout niveau

**Fichier(s) :** Absent à la racine de `app/`, `(dashboard)/`, `(auth)/`, `admin/`

**Règle du référentiel :** "Catches errors in a route segment and its children. `error.tsx` must be a Client Component."

**Code actuel :** Aucun fichier `error.tsx` dans l'arborescence.

**Risque :** Toute exception non gérée dans un Server Component affiche la page d'erreur Next.js par défaut (stack trace en dev, page blanche en prod). L'utilisateur n'a pas de message localisé ni de bouton « Réessayer ». Impact UX direct en production.

**Priorité :** P1 (UX mesurable en cas d'erreur serveur).

**Effort estimé :** S — créer `app/error.tsx` (Client Component avec `reset()`) et optionnellement `app/(dashboard)/error.tsx`.

---

#### [Error handling] — Absence de `global-error.tsx`

**Fichier(s) :** Absent à la racine de `app/`

**Règle du référentiel :** "Catches errors in root layout. Must include `<html>` and `<body>` tags."

**Code actuel :** Absent.

**Risque :** Si le root layout (`app/layout.tsx`) lève une exception (crash de `ThemeProvider` ou `PostHogProvider`), Next.js n'a aucun fallback. L'application affiche une page blanche totale sans possibilité de récupération.

**Priorité :** P1 (absence du filet de sécurité au niveau le plus haut).

**Effort estimé :** S — créer `app/global-error.tsx` avec balises `<html>/<body>` et un bouton `reset()`.

---

#### [Error handling] — Absence de `not-found.tsx`

**Fichier(s) :** Absent à tout niveau

**Règle du référentiel :** "Custom 404 page for a route segment." Les pages appellent déjà `notFound()` (`fiches/[ficheId]/page.tsx` ligne 27, `schemas/[schemaId]/page.tsx` ligne 18, etc.).

**Code actuel :**
```tsx
// fiches/[ficheId]/page.tsx
if (!fiche) notFound()  // → affiche la 404 Next.js par défaut, non brandée
```

**Risque :** La page 404 par défaut de Next.js est en anglais et sans le branding Studra. Mineur sur le SEO mais nuit à la cohérence de marque.

**Priorité :** P2 (cosmétique / qualité de marque).

**Effort estimé :** S — créer `app/not-found.tsx`.

---

#### [Error handling] — Absence de `loading.tsx`

**Fichier(s) :** Absent à tout niveau

**Règle du référentiel :** "`loading.tsx` — Loading UI (Suspense boundary)." Enveloppe automatiquement les segments dans une `<Suspense>`.

**Code actuel :** Absent. Les pages client gèrent le chargement manuellement avec `useState(true)`.

**Risque :** Les navigations entre segments dashboard n'affichent aucun indicateur visuel pendant le chargement. Perçu comme bloqué sur liaisons lentes.

**Priorité :** P2 (UX, non bloquant).

**Effort estimé :** S — créer `app/(dashboard)/loading.tsx` avec un skeleton minimal.

---

### 2.8 Data patterns

---

#### [Data patterns] — Lectures Supabase depuis Client Components via `useEffect`

**Fichier(s) :** `(dashboard)/exams/page.tsx`, `(dashboard)/fiches/page.tsx`, `(dashboard)/flashcards/page.tsx`, `(dashboard)/planning/page.tsx`, `(dashboard)/timelines/page.tsx`, `(dashboard)/annales/page.tsx`, `(dashboard)/schemas/page.tsx` (et leurs variantes `[id]/`)

**Règle du référentiel :** "Server Components for reads — Fetch data directly in Server Components — no API layer needed. Direct database access, no client-server waterfall, secrets stay on server."

**Code actuel (exemple `exams/page.tsx`) :**
```tsx
'use client'
export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('exams').select('*')
      setExams(data ?? [])
    }
    load()
  }, [])
```

**Risque :** Chaque page effectue un waterfall client-server lors du premier rendu : HTML vide → JS bundle → fetch Supabase → rendu des données. Avec un Server Component, les données seraient dans le HTML initial. Impact LCP mesurable sur liaisons 4G.

**Priorité :** P2 (perf mesurable, mais le dashboard est `force-dynamic`, donc le SSR d'une coquille vide est déjà le cas actuel).

**Effort estimé :** L — refactoriser chaque page en Server Component. Nécessite une analyse cas par cas (certaines pages ont des interactions temps-réel qui justifient le client).

---

### 2.9 Route handlers

Aucun écart détecté.

- Aucun conflit `route.ts` / `page.tsx` au même chemin (les APIs sont sous `api/`, les pages sous les segments applicatifs).
- Tous les `params` des route handlers sont typés `Promise<...>` et awaités.
- Pas d'usage de React DOM dans les route handlers.
- Webhooks Stripe dans `api/webhooks/stripe/route.ts` — usage correct pour un webhook externe.
- Checkout/portal Stripe dans `api/billing/` — correct pour une intégration Stripe.

---

### 2.10 Metadata & OG images

---

#### [Metadata & OG images] — `runtime = 'edge'` sur l'OG image racine

Déjà documenté dans la section 2.4 Runtime selection.

---

#### [Metadata & OG images] — `alt` absent sur les 4 OG images des pages SEO

**Fichier(s) :** `(seo)/examen-blanc-ia/opengraph-image.tsx`, `(seo)/flashcards-ia/opengraph-image.tsx`, `(seo)/fiches-de-revision-ia/opengraph-image.tsx`, `(seo)/repetition-espacee/opengraph-image.tsx`

**Règle du référentiel :** Le référentiel montre systématiquement `export const alt = 'Blog Post'` comme export obligatoire dans chaque exemple d'OG image.

**Code actuel (exemple `flashcards-ia/opengraph-image.tsx`) :**
```tsx
import { ImageResponse } from 'next/og'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// export const alt  ← absent
export default function Image() { ... }
```

**Risque :** L'absence de `export const alt` laisse le texte alternatif vide pour les lecteurs d'écran sur les partages réseaux sociaux.

**Priorité :** P2 (accessibilité / cosmétique).

**Effort estimé :** S — ajouter `export const alt = '...'` dans les 4 fichiers.

---

### 2.11 Image optimization

Aucun écart détecté.

- `next/image` utilisé dans `Footer.tsx` et `NavClient.tsx` pour le logo.
- Aucune balise `<img>` native détectée dans les composants applicatifs.
- Pas d'images distantes → `remotePatterns` non requis pour l'instant.

---

### 2.12 Font optimization

Aucun écart détecté.

- 5 polices définies dans `app/layout.tsx` via `next/font/google` : `Inter`, `Instrument_Serif`, `JetBrains_Mono`, `DM_Sans`, `DM_Serif_Display`.
- Toutes ont `subsets: ['latin']` défini.
- Aucun `<link href="fonts.googleapis.com">` ni `@import` CDN Google Fonts dans les CSS.
- Les polices non-`inter` exposent des CSS variables (`variable: '--font-serif'`, etc.) pour Tailwind.
- `inter.className` appliqué directement sur `<body>` — pattern valide.

---

### 2.13 Bundling

Aucun écart significatif détecté.

- `serverExternalPackages: ['pdf-parse']` dans `next.config.ts`. Correct (pdf-parse a des bindings natifs).
- `SchemaEditorClient.tsx` utilise `dynamic(() => import('./SchemaEditor'), { ssr: false })` pour le canvas custom. Conforme.
- Aucun `webpack: (config) => {}` custom.
- Imports CSS via `import './globals.css'` — conforme.

---

### 2.14 Scripts

---

#### [Scripts] — Balises `<script>` natives pour JSON-LD dans `blog/[slug]/page.tsx`

**Fichier :** `src/app/blog/[slug]/page.tsx` (lignes 154-156)

**Règle du référentiel :** "Always use `next/script` instead of native `<script>` tags for better performance. Inline scripts need `id`."

**Code actuel :**
```tsx
// Trois balises <script type="application/ld+json"> avec innerHTML inline
// articleJsonLd, faqJsonLd, breadcrumbLd — aucune n'a d'attribut id
```

**Risque :** Le référentiel exige `id` sur les scripts inline via `next/script`. Pour les scripts JSON-LD (données structurées SEO, pas de JavaScript exécutable), le pattern `<script type="application/ld+json">` directement dans un Server Component est la convention Next.js standard. L'impact pratique est très faible (pas d'exécution JS, pas de cycle de vie à gérer). Je classe ceci P2 avec incertitude — ce pattern est possiblement hors scope du référentiel qui cible les scripts tiers.

**Priorité :** P2 (incertain — à valider selon interprétation du référentiel).

**Effort estimé :** S — ajouter des attributs `id` sur les balises existantes.

---

### 2.15 Hydration errors

Aucun écart confirmé détecté.

- `window.origin` dans `providers.tsx` est à l'intérieur d'un `useEffect` — pas de risque de mismatch.
- `suppressHydrationWarning` sur `<html>` est justifié par `ThemeProvider` (dark/light mode).
- `new Date()` dans les Server Components admin (`admin/page.tsx`, `admin/generations/page.tsx`, `admin/paiements/page.tsx`) est rendu server-side uniquement → pas de hydration mismatch.
- `DashboardHeader` utilise `new Date()` en Server Component → pas de risque.
- HTML structure : aucun `<div>` imbriqué dans `<p>` détecté.

---

### 2.16 Suspense boundaries

---

#### [Suspense boundaries] — `usePathname()` dans `Sidebar` sans Suspense sur routes dynamiques dashboard

**Fichier(s) :** `src/components/sidebar.tsx` (ligne 60), utilisé dans `src/components/dashboard-shell.tsx`

**Règle du référentiel :** "usePathname() requires Suspense boundary when route has dynamic parameters. If you use `generateStaticParams`, Suspense is optional."

**Code actuel :**
```tsx
// components/sidebar.tsx ('use client')
const pathname = usePathname()
const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
```

```tsx
// components/dashboard-shell.tsx — pas de Suspense autour de <Sidebar>
<Sidebar isOpen={sidebarOpen} onClose={...} isPro={isPro} />
```

**Risque :** Sur les routes dashboard dynamiques (`/planning/[planId]`, `/schemas/[schemaId]`, etc.) sans `generateStaticParams`, `usePathname()` peut déclencher un CSR bailout. L'impact pratique est atténué par `force-dynamic` sur le layout dashboard, mais techniquement non conforme.

**Priorité :** P2 (incertain — `force-dynamic` atténue le problème).

**Effort estimé :** S — envelopper `<Sidebar>` dans `<Suspense fallback={<SidebarSkeleton />}>` dans `dashboard-shell.tsx`.

---

#### [Suspense boundaries] — `usePathname()` dans admin `Sidebar` sans Suspense

**Fichier(s) :** `src/components/admin/Sidebar.tsx` (ligne 23), utilisé dans les pages admin

**Règle du référentiel :** Idem ci-dessus.

**Code actuel :**
```tsx
// components/admin/Sidebar.tsx ('use client')
const pathname = usePathname()
```

La page `/admin/emails/[id]` est une route dynamique sans `generateStaticParams`. La `Sidebar` admin y est rendue sans `<Suspense>`.

**Risque :** Route dynamique sans Suspense pour `usePathname()`. Trafic admin limité, impact faible.

**Priorité :** P2 (trafic admin limité).

**Effort estimé :** S — envelopper `<Sidebar />` dans `<Suspense>` dans les pages admin dynamiques.

---

### 2.17 Parallel & intercepting routes

Aucun écart — non utilisés dans ce projet.

---

### 2.18 Self-hosting

Aucun écart.

- Pas de `output: 'standalone'` dans `next.config.ts` — cohérent avec un déploiement Vercel.
- Pas de `cacheHandler` — cohérent (Vercel gère le cache).
- Pas de `app/api/health/route.ts` — non requis pour Vercel.

---

## 3. Synthèse

### 3.1 Tableau récapitulatif

| Catégorie | P0 | P1 | P2 |
|-----------|----|----|-----|
| File conventions | 0 | 0 | 1 |
| RSC boundaries | 0 | 0 | 0 |
| Async patterns | 0 | 0 | 0 |
| Runtime selection | 0 | 1 | 0 |
| Directives | 0 | 0 | 0 |
| Functions | 0 | 0 | 0 |
| Error handling | 0 | 2 | 2 |
| Data patterns | 0 | 0 | 1 |
| Route handlers | 0 | 0 | 0 |
| Metadata & OG images | 0 | 1 | 1 |
| Image optimization | 0 | 0 | 0 |
| Font optimization | 0 | 0 | 0 |
| Bundling | 0 | 0 | 0 |
| Scripts | 0 | 0 | 1 |
| Hydration errors | 0 | 0 | 0 |
| Suspense boundaries | 0 | 0 | 2 |
| Parallel & intercepting | n/a | n/a | n/a |
| Self-hosting | 0 | 0 | 0 |
| **TOTAL** | **0** | **4** | **8** |

---

### 3.2 Top 5 priorités absolues

1. **[P1] Créer `app/global-error.tsx`** — Sans ce fichier, un crash dans le root layout (ThemeProvider, PostHogProvider) affiche une page blanche totale sans récupération possible. Effort S, filet de sécurité le plus critique.

2. **[P1] Créer `app/error.tsx`** — Sans fichier d'erreur, toute exception server-side en production est silencieuse pour l'utilisateur (page blanche non brandée). Effort S, impact UX immédiat.

3. **[P1] Supprimer `runtime = 'edge'` sur `app/opengraph-image.tsx`** — Le référentiel le déconseille explicitement pour les OG images. L'ajout future d'une font locale casserait l'OG image en production sans erreur claire. Effort S (1 ligne à supprimer).

4. **[P1] Créer `app/not-found.tsx`** — Les pages dashboard appellent déjà `notFound()` mais il n'y a aucune page 404 personnalisée. La 404 actuelle est en anglais, sans le branding Studra. Effort S.

5. **[P2] Créer `app/(dashboard)/loading.tsx`** — Les navigations entre segments dashboard n'ont aucun feedback visuel pendant le chargement. Un skeleton minimal améliore significativement la perception de performance. Effort S.

---

### 3.3 Catégories conformes

- **RSC boundaries** — Aucun async client component, aucune prop non sérialisable détectée.
- **Async patterns** — `params`, `searchParams`, `cookies()` correctement awaités partout.
- **Directives** — `'use client'` bien positionné, aucun misusage.
- **Functions** — `next/link` utilisé partout, navigation hooks corrects.
- **Route handlers** — Aucun conflit page/route, params typés Promise, pas de React DOM.
- **Image optimization** — `next/image` utilisé, aucune `<img>` native.
- **Font optimization** — `next/font/google` partout, subsets définis, pas de CDN Google Fonts.
- **Bundling** — `serverExternalPackages` correct, `dynamic(..., { ssr: false })` pour le canvas custom.
- **Hydration errors** — Aucun `new Date()` / `Math.random()` dans le JSX client, pas de HTML invalide.
- **Parallel & intercepting routes** — Non utilisés.
- **Self-hosting** — Non applicable, configuration Vercel cohérente.
- **Metadata (usage général)** — `metadata` exporté uniquement depuis des Server Components. `generateMetadata` avec `await params` correct. `next/og` utilisé (pas `@vercel/og`).

---

### 3.4 Limites de l'audit

1. **Props dynamiques non vérifiées champ par champ** — Les objets imbriqués passés de Server → Client (ex: `data.user` dans `DashboardHeader`) n'ont pas été inspectés pour des valeurs non sérialisables en profondeur. Un `Date` object imbriqué passerait inaperçu.

2. **Build réel non exécuté** — L'audit est statique. Des erreurs de bundling ou d'hydration visibles uniquement à `next build` n'ont pas été détectées.

3. **Absence de Server Actions** — Aucune Server Action n'est définie. La règle "ne jamais wrapper `redirect()` dans un `try/catch`" n'a donc pas pu être vérifiée sur ce pattern.

4. **`new Date()` dans modal de planning** — Le composant `PlanEditModal` (Client Component, ligne 768 de `planning/[planId]/page.tsx`) calcule `new Date()` pour dériver une chaîne `minDate`. L'éventuel mismatch entre server et client sur cet attribut `min` n'est pas vérifiable statiquement.

5. **Performance data waterfall réelle** — L'écart "lectures Supabase depuis Client Components" (section 2.8) est classé P2 mais son impact LCP réel dépend de la latence réseau. Non mesuré ici.

6. **`remotePatterns` non configuré** — Aucune image distante n'a été détectée dans le code actuel. Si des avatars Supabase Storage ou un CDN sont ajoutés ultérieurement, il faudra configurer `remotePatterns` dans `next.config.ts`.

7. **`@xyflow/react` en dépendance sans import direct** — La dépendance est dans `package.json` mais aucun import direct n'apparaît dans le code (le canvas utilise un SVG custom). Impossible de valider statiquement si elle est vraiment inutilisée.

---

## 4. Observations hors référentiel

*Patterns observés qui semblent discutables mais ne sont pas couverts par le référentiel `next-best-practices`. Aucun classement P0/P1/P2.*

**A. `runtime = 'nodejs'` explicite redondant sur 6 routes**
`app/api/admin/emails/*/route.ts` et `app/api/unsubscribe/route.ts` déclarent `export const runtime = 'nodejs'`. Node.js étant le runtime par défaut, ces lignes sont sans effet fonctionnel. Elles peuvent induire en erreur en laissant penser que la route nécessite un runtime particulier.

**B. Architecture "Client Component as page" généralisée dans le dashboard**
La quasi-totalité des pages dashboard sont des Client Components qui fetchent via le Supabase JS client dans un `useEffect`. C'est fonctionnel mais renonce aux avantages du SSR (LCP, SEO, pas de flash de contenu). Le référentiel couvre ceci dans "Data patterns" (classé P2 section 2.8), mais l'ampleur du pattern justifie une réflexion architecturale globale plutôt qu'une correction fichier par fichier.

**C. Absence de Server Actions**
Toutes les mutations UI passent par `fetch('/api/...')` en Client Component. Les Server Actions offriraient la progressive enhancement et l'élimination d'une couche d'API interne. Ce n'est pas un écart (les Route Handlers sont valides), mais une opportunité à considérer lors d'une refacto future.

**D. `dynamic = 'force-dynamic'` sur le dashboard et auth layouts**
`(dashboard)/layout.tsx` et `(auth)/layout.tsx` exportent `export const dynamic = 'force-dynamic'`. Correct pour des layouts authentifiés, à conserver intentionnellement.

**E. `@xyflow/react` potentiellement inutilisé**
Dépendance déclarée dans `package.json` mais aucun import direct trouvé dans le code (le canvas `schemas/` utilise un SVG custom). Si la dépendance est obsolète, elle alourdit le bundle de développement et les audits de sécurité sans bénéfice.
