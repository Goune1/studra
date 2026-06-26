# Audit SEO Studra — Rapport complet
*Date : 2 juin 2026 — Lecture seule, aucune modification*

---

## Résumé exécutif

**Score SEO global estimé : 7.5 / 10**

La base SEO de Studra est solide : balises `lang="fr"`, `metadataBase`, Open Graph et Twitter Cards sur toutes les pages publiques, canonicals présents sur les routes SEO prioritaires, sitemap dynamique, robots.ts, JSON-LD (FAQPage, BreadcrumbList, Article, SoftwareApplication, WebSite, Organization) sur l'ensemble des pages. C'est un niveau de maturité au-dessus de la moyenne.

Trois problèmes méritent une correction immédiate :

| Priorité | Problème | Impact |
|---|---|---|
| 🔴 1 | Description du root layout > 160 chars (191 chars) | Troncature dans tous les SERPs pour les pages sans description propre |
| 🔴 2 | Titre `/repetition-espacee` > 60 chars (≈ 80 chars) | Troncature garantie dans Google — titre clé pour le trafic organique |
| 🔴 3 | Route `/bac/` (dashboard) absente du robots.txt | Page privée crawlable et potentiellement indexable |

---

## 1. Metadata et balises

### 1.1 Balises `<title>`

| Page | Titre | Longueur | Statut |
|---|---|---|---|
| `/` | Studra — Révise sérieusement. Sans y passer ses nuits. | 54 | ✅ |
| `/flashcards-ia` | Créer des flashcards avec l'IA depuis un PDF ou un cours \| Studra | ~65 | 🟡 |
| `/fiches-de-revision-ia` | Générateur de fiches de révision IA \| Studra | 46 | ✅ |
| `/repetition-espacee` | Répétition espacée gratuite avec IA — Mémorise plus en moins de temps \| Studra | ~80 | 🔴 |
| `/examen-blanc-ia` | Génère un examen blanc depuis ton cours en un clic \| Studra | 60 | ✅ |
| `/blog` | Blog Studra — Méthodes de révision, flashcards IA et science de la mémoire | 73 | 🟡 |
| `/blog/[slug]` | Titre du post (dynamique) | variable | ✅ |
| `/cgu` | Conditions Générales d'Utilisation | 37 | ✅ |
| Root layout (fallback) | Studra – Révision intelligente avec l'IA | 41 | ✅ |

**🔴 Bloquant — `/repetition-espacee`** (`src/app/(seo)/repetition-espacee/page.tsx:5`)
Le titre fait ≈ 80 caractères. Google tronque à ~60 chars. La coupure survient avant le mot-clé secondaire.

**🟡 Mineur — `/flashcards-ia` et `/blog`**
Légèrement au-dessus de 60 chars. Troncature possible selon l'écran.

```ts
// Correction /repetition-espacee — titre raccourci
title: 'Répétition espacée avec IA (FSRS 5) — Mémorise durablement | Studra',
// 68 chars — encore borderline, version optimale :
title: 'Répétition espacée IA — FSRS 5 | Studra',
// 41 chars ✅
```

---

### 1.2 Meta descriptions

| Page | Longueur | Statut |
|---|---|---|
| Root layout (fallback) | ~191 chars | 🔴 |
| `/` | ~141 chars | ✅ |
| `/flashcards-ia` | ~163 chars | 🟡 |
| `/fiches-de-revision-ia` | ~112 chars | ✅ |
| `/repetition-espacee` | ~153 chars | ✅ |
| `/examen-blanc-ia` | ~143 chars | ✅ |
| `/blog` | ~129 chars | ✅ |

**🔴 Bloquant — Root layout** (`src/app/layout.tsx:59-61`)
La description du root layout est utilisée comme fallback pour toutes les pages sans description propre (ex : `/bac/`, `/unsubscribe/`). Elle fait 191 chars, au-dessus de la limite de 160.

```ts
// Correction
description: "Studra transforme ton cours en flashcards, fiches et examens blancs en 10 secondes. Répétition espacée FSRS 5. Gratuit.",
// 118 chars ✅
```

**🟡 Mineur — `/flashcards-ia`** : 163 chars, quelques mots au-dessus.

---

### 1.3 Open Graph

| Vérification | Statut |
|---|---|
| `og:title` présent sur toutes les pages publiques | ✅ |
| `og:description` présent sur toutes les pages publiques | ✅ |
| `og:url` présent sur toutes les pages publiques | ✅ |
| `og:type` = `website` (pages SEO) et `article` (blog posts) | ✅ |
| `og:image` via `opengraph-image.tsx` (racine + 4 pages SEO + blog/[slug]) | ✅ |
| Dimensions OG image : 1200×630 | ✅ |
| `og:siteName` = Studra | ✅ |
| `og:locale` = `fr_FR` | ✅ |

**🟠 Important — OG image racine mentionne "GPT-5 nano"** (`src/app/opengraph-image.tsx:72`)
Le badge dans l'image OG affiche `Propulsé par GPT-5 nano`. Ce modèle n'existe pas publiquement. Cela génère une potentielle méfiance des utilisateurs lors du partage social.

**🟠 Important — Twitter card des articles de blog sans image explicite**
La génération de metadata dans `src/app/blog/[slug]/page.tsx:34-39` ne définit pas `twitter.images`. Next.js devrait auto-résoudre via `opengraph-image.tsx`, mais l'absence explicite est un risque si la résolution automatique échoue.

```ts
// Correction blog/[slug]/page.tsx
twitter: {
  card: 'summary_large_image',
  title: post.title,
  description: post.description,
  images: [`https://studra.fr/blog/${post.slug}/opengraph-image`],
},
```

---

### 1.4 Canonical

| Page | Canonical défini | Correct | Statut |
|---|---|---|---|
| `/` | ✅ `https://studra.fr` | ✅ | ✅ |
| `/flashcards-ia` | ✅ | ✅ | ✅ |
| `/fiches-de-revision-ia` | ✅ | ✅ | ✅ |
| `/repetition-espacee` | ✅ | ✅ | ✅ |
| `/examen-blanc-ia` | ✅ | ✅ | ✅ |
| `/blog` | ✅ | ✅ | ✅ |
| `/blog/[slug]` | ✅ dynamique | ✅ | ✅ |
| `/cgu` | ✅ | ✅ | ✅ |
| `/cgv` | ✅ | ✅ | ✅ |
| `/confidentialite` | ✅ | ✅ | ✅ |
| `/changelog` | ✅ | ✅ | ✅ |
| `/login` | ❌ (hérité du root layout → `https://studra.fr`) | ❌ | 🟠 |
| `/register` | ❌ (idem) | ❌ | 🟠 |
| `/unsubscribe` | ❌ | ❌ | 🟡 |

**🟠 Important — Canonical erroné sur `/login` et `/register`**
Le root layout (`src/app/layout.tsx:109-111`) définit `alternates: { canonical: 'https://studra.fr' }`. En Next.js, ce canonical est hérité par toutes les pages qui ne définissent pas leur propre `alternates`. La page `/login` n'est pas crawlée (noindex dans auth layout), mais c'est une dette technique.

---

## 2. Sitemap et robots

### 2.1 Sitemap (`src/app/sitemap.ts`)

| Vérification | Statut |
|---|---|
| Fichier dynamique Next.js (`sitemap.ts`) | ✅ |
| URL de base correcte `https://studra.fr` | ✅ |
| Toutes les pages SEO présentes | ✅ |
| `lastModified` présent sur toutes les entrées | ✅ |
| `changeFrequency` renseigné | ✅ |
| `priority` cohérent (homepage = 1.0, SEO = 0.9, blog = 0.6-0.7) | ✅ |
| Blog posts générés dynamiquement depuis `blogPosts` | ✅ |

**🟠 Important — `/login` et `/register` dans le sitemap malgré `noindex`**
(`src/app/sitemap.ts:54-65`)
Ces deux pages ont `robots: { index: false, follow: false }` via `src/app/(auth)/layout.tsx`. Les inclure dans le sitemap envoie un signal contradictoire aux crawlers. Google peut ignorer le sitemap pour ces URLs ou créer une confusion.

```ts
// Retirer ces deux entrées du sitemap
// { url: `${BASE_URL}/register`, ... },
// { url: `${BASE_URL}/login`, ... },
```

**🟡 Mineur — `/confidentialite` absente du sitemap**
La page existe, a un canonical et une description, mais n'est pas dans `src/app/sitemap.ts`. À ajouter avec `priority: 0.2` et `changeFrequency: 'yearly'`.

---

### 2.2 Robots.txt (`src/app/robots.ts`)

| Vérification | Statut |
|---|---|
| Fichier `robots.ts` dynamique | ✅ |
| Référence au sitemap | ✅ |
| `/api/` désindexé | ✅ |
| `/admin/` désindexé | ✅ |
| `/auth/` désindexé | ✅ |
| Toutes les routes dashboard désindexées | 🟠 |
| Pages SEO publiques autorisées | ✅ |

**🔴 Bloquant — `/bac/` absent du disallow** (`src/app/robots.ts`)
La page `src/app/(dashboard)/bac/page.tsx` est rendue à l'URL `/bac/` (le groupe `(dashboard)` est transparent). Cette route n'est pas dans la liste `disallow`, contrairement à toutes les autres routes du dashboard.

```ts
// Correction — src/app/robots.ts
disallow: [
  '/dashboard/',
  '/flashcards/',
  '/fiches/',
  '/schemas/',
  '/timelines/',
  '/exams/',
  '/lacunes/',
  '/settings/',
  '/billing/',
  '/admin/',
  '/api/',
  '/auth/',
  '/socrate/',
  '/recall/',
  '/annales/',
  '/planning/',
  '/upgrade/',
  '/bac/',        // ← MANQUANT
  '/unsubscribe/', // ← recommandé
],
```

**🟡 Mineur — `/unsubscribe/` crawlable**
Page transactionnelle (lien de désinscription email) accessible par les bots. Pas d'impact SEO direct mais représente du crawl budget inutile.

---

## 3. Structure HTML et sémantique

### 3.1 Headings

| Page | H1 unique | Contenu H1 | Hiérarchie cohérente |
|---|---|---|---|
| `/` | ✅ (dans Hero) | Dynamique, contient les mots-clés | ✅ |
| `/flashcards-ia` | ✅ | "Crée tes flashcards automatiquement avec l'IA" | ✅ |
| `/fiches-de-revision-ia` | ✅ | "Génère des fiches de révision en quelques secondes grâce à l'IA" | ✅ |
| `/repetition-espacee` | ✅ | "La répétition espacée scientifiquement prouvée pour mémoriser plus" | ✅ |
| `/examen-blanc-ia` | ✅ | "Génère un examen blanc depuis ton cours en un clic" | ✅ |
| `/blog` | ✅ | "Le blog Studra" | ✅ |
| `/blog/[slug]` | ✅ | Titre du post | ✅ |
| `/cgu` | ✅ | "Conditions Générales d'Utilisation" | ✅ |
| `/confidentialite` | ✅ | "Politique de confidentialité" | ✅ |

### 3.2 Images

| Vérification | Statut |
|---|---|
| Logo dans Nav : `next/image` avec `alt="Studra"`, `priority` | ✅ |
| Images landing (MockupWindow) via `next/image` | ✅ |
| Footer logo via `next/image` | ✅ |
| Aucun `<img>` natif détecté dans les composants landing | ✅ |

Aucun problème majeur sur les images. Le logo est correctement marqué `priority` (potentiel élément LCP).

### 3.3 Contenu et rendu côté serveur

**🟠 Important — Hero avec `initial={{ opacity: 0 }}`** (`src/components/landing/hero/Hero.tsx:1`)
Le composant Hero est `'use client'` (Framer Motion). Il utilise `initial={{ opacity: 0, y: 24 }}` sur tous les éléments animés, dont le H1. Même si Next.js SSR inclut le HTML initial, l'opacité CSS est à 0 avant hydration. Si JavaScript met du temps à charger, le H1 est invisible pendant ce délai, ce qui impacte le LCP et l'expérience utilisateur.

```tsx
// Solution : fallback visuel côté serveur via CSS
// Ou : utiliser des animations CSS natives plutôt que JS pour le H1
```

**🟡 Mineur — `SeoLinks` composant créé mais non utilisé**
(`src/components/landing/SeoLinks.tsx`)
Le composant est défini mais n'est jamais importé nulle part. La landing page (`src/app/page.tsx`) ne l'inclut pas. Ces liens internes vers les pages SEO sont pourtant précieux pour le PageRank interne.

---

## 4. Performance et Core Web Vitals

### 4.1 Rendu

| Vérification | Statut |
|---|---|
| Pages SEO : Server Components par défaut | ✅ |
| Landing page (`/`) : Server Component | ✅ |
| Dashboard layout : Server Component avec appel Supabase | ✅ (hors chemin public) |
| Appels Supabase dans le chemin de rendu public | ❌ non (aucun dans pages publiques) |

Aucun appel BDD détecté dans les layouts/pages publiques. Le root layout ne fait pas d'appel Supabase. ✅

### 4.2 Fonts

| Vérification | Statut |
|---|---|
| Toutes les polices via `next/font/google` | ✅ |
| Pas de `@import` CSS ou `<link>` Google Fonts | ✅ |
| `display: swap` (géré automatiquement par `next/font`) | ✅ |

**🟡 Mineur — 7 polices chargées** (`src/app/layout.tsx:12-51`)
Inter, Instrument_Serif, JetBrains_Mono, DM_Serif_Display, DM_Sans, Geist, Geist_Mono. Même optimisées par `next/font`, 7 familles de polices génèrent des requêtes réseau supplémentaires. Vérifier si toutes sont réellement utilisées dans le rendu final.

### 4.3 Scripts tiers

| Script | Chargement | Statut |
|---|---|---|
| Vercel Analytics | Auto-optimisé (paquet dédié) | ✅ |
| Vercel Speed Insights | Auto-optimisé | ✅ |
| PostHog | Client-side (`'use client'`, dans `<Suspense>`) | ✅ |

PostHog est correctement encapsulé dans `<Suspense>` et ne bloque pas le rendu serveur. L'initialisation se fait côté client via `useEffect`. Pas de blocage LCP.

---

## 5. Structured Data (JSON-LD)

### 5.1 Landing page (`/`)

| Schema | Présent | Complet |
|---|---|---|
| `Organization` | ✅ | ✅ |
| `WebSite` + `SearchAction` | ✅ | 🟡 |
| `SoftwareApplication` | ✅ | ✅ |
| `FAQPage` | ✅ | ✅ |

**🟡 Mineur — SearchAction pointe vers un blog sans moteur de recherche**
(`src/components/landing/LandingJsonLd.tsx:26-30`)
Le `potentialAction` de type `SearchAction` avec `target: 'https://studra.fr/blog?q={search_term_string}'` suppose que le blog propose une fonctionnalité de recherche. Or le blog est une liste statique sans moteur de recherche. Google Search Console peut signaler cette erreur. Supprimer le `potentialAction` si la recherche n'est pas implémentée.

### 5.2 Pages SEO (`/flashcards-ia`, etc.)

| Page | Schemas | Statut |
|---|---|---|
| `/flashcards-ia` | FAQPage + BreadcrumbList | ✅ |
| `/fiches-de-revision-ia` | FAQPage + BreadcrumbList | ✅ |
| `/repetition-espacee` | FAQPage + BreadcrumbList | ✅ |
| `/examen-blanc-ia` | FAQPage + BreadcrumbList | ✅ |

Toutes les FAQPage sont bien formées. Les BreadcrumbList correspondent à la structure réelle.

**🟡 Recommandé — Ajouter `SoftwareApplication` ou `WebPage` sur les pages features**
Pour renforcer le signal de ces pages comme des pages produit (éligibilité à des rich results supplémentaires).

### 5.3 Articles de blog (`/blog/[slug]`)

| Champ | Présent | Statut |
|---|---|---|
| `@type: Article` | ✅ | ✅ |
| `headline` | ✅ | ✅ |
| `description` | ✅ | ✅ |
| `datePublished` | ✅ | ✅ |
| `author` | ✅ (Organization) | ✅ |
| `publisher` | ✅ | ✅ |
| `url` | ✅ | ✅ |
| `image` | ❌ absent | 🟠 |
| `dateModified` | ❌ absent | 🟡 |
| `inLanguage` | ✅ `fr` | ✅ |

**🟠 Important — `image` manquant dans Article JSON-LD** (`src/app/blog/[slug]/page.tsx:130-140`)
Google requiert le champ `image` pour l'éligibilité aux **Article rich results** dans les SERPs. Sans ce champ, les articles ne peuvent pas prétendre à l'affichage enrichi.

```ts
// Correction src/app/blog/[slug]/page.tsx
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.description,
  datePublished: post.publishedAt,
  dateModified: post.publishedAt, // ou un champ updatedAt si disponible
  image: `https://studra.fr/blog/${post.slug}/opengraph-image`,
  inLanguage: 'fr',
  author: { '@type': 'Organization', name: 'Studra' },
  publisher: { '@type': 'Organization', name: 'Studra', url: 'https://studra.fr' },
  url: `https://studra.fr/blog/${post.slug}`,
}
```

---

## 6. Architecture des routes publiques SEO

| Route prévue | Statut | Notes |
|---|---|---|
| `/` | ✅ Existe | Landing complète |
| `/flashcards-ia` | ✅ Existe | Page SEO complète |
| `/fiches-de-revision-ia` | ✅ Existe | Page SEO complète |
| `/repetition-espacee` | ✅ Existe | Page SEO complète |
| `/examen-blanc-ia` | ✅ Existe | Page SEO complète |
| `/blog` | ✅ Existe | Liste des articles |
| `/blog/[slug]` | ✅ Existe | Articles dynamiques |
| `/tarifs` ou `/pricing` | ❌ **Manquante** | Le pricing est sur la landing uniquement |
| `/mentions-legales` | ❌ **Manquante** | Obligation légale française |
| `/confidentialite` | ✅ Existe (à `/confidentialite`) | |
| `/cgu` | ✅ Existe | |
| `/cgv` | ✅ Existe | |

---

## 7. Internationalisation

| Vérification | Statut |
|---|---|
| `lang="fr"` sur `<html>` dans `src/app/layout.tsx:120` | ✅ |
| Pas de `hreflang` incorrect | 🟡 |
| Site monolingue (pas besoin de hreflang) | ✅ |

**🟡 Mineur — `hreflang` inutiles**
Toutes les pages SEO définissent `alternates: { languages: { fr: 'https://studra.fr/...' } }`. Le tag `hreflang` est conçu pour les sites multilingues (indiquer la version anglaise vs française d'une même page). Sur un site 100% français, ces tags sont superflus et ajoutent du bruit. Ils ne sont pas nuisibles, mais peuvent être retirés.

---

## 8. Problèmes trouvés — Récapitulatif classé

### 🔴 Bloquant

| # | Catégorie | Fichier | Problème | Correction |
|---|---|---|---|---|
| B1 | Metadata | `src/app/layout.tsx:59` | Description fallback = 191 chars (max 160) | Raccourcir à < 155 chars |
| B2 | Metadata | `src/app/(seo)/repetition-espacee/page.tsx:5` | Titre = ~80 chars (max 60) | Raccourcir à < 60 chars |
| B3 | Crawlabilité | `src/app/robots.ts:9` | `/bac/` absent du disallow — page dashboard privée crawlable | Ajouter `'/bac/'` au tableau `disallow` |

### 🟠 Important

| # | Catégorie | Fichier | Problème | Correction |
|---|---|---|---|---|
| I1 | Crawlabilité | `src/app/sitemap.ts:54-65` | `/login` et `/register` dans le sitemap malgré `noindex` | Retirer ces deux entrées du sitemap |
| I2 | Performance | `src/components/landing/hero/Hero.tsx:1` | Hero `'use client'` + `initial={{ opacity: 0 }}` sur le H1 → risque LCP | Utiliser CSS animation ou conditionner l'animation post-hydration |
| I3 | Structured Data | `src/app/blog/[slug]/page.tsx:130` | Champ `image` manquant dans le JSON-LD `Article` → non éligible aux rich results | Ajouter `image: \`https://studra.fr/blog/${post.slug}/opengraph-image\`` |
| I4 | Metadata | `src/app/opengraph-image.tsx:72` | OG image racine affiche "GPT-5 nano" (modèle inexistant) | Corriger le texte du badge |
| I5 | Contenu | `src/components/landing/SeoLinks.tsx` | Composant de liens internes vers les pages SEO créé mais jamais utilisé | Intégrer `<SeoLinks />` dans la landing page (`src/app/page.tsx`) |
| I6 | Metadata | `src/app/blog/[slug]/page.tsx:34` | Twitter card des articles sans `images` explicit | Ajouter `images: [\`https://studra.fr/blog/${post.slug}/opengraph-image\`]` |

### 🟡 Mineur

| # | Catégorie | Fichier | Problème | Correction |
|---|---|---|---|---|
| M1 | Metadata | `src/app/(seo)/flashcards-ia/page.tsx:5` | Titre = ~65 chars (légèrement > 60) | Raccourcir si possible |
| M2 | Metadata | `src/app/blog/page.tsx:8` | Titre blog = ~73 chars | Raccourcir |
| M3 | Crawlabilité | `src/app/robots.ts` | `/unsubscribe/` non désindexé | Ajouter `'/unsubscribe/'` au disallow |
| M4 | Crawlabilité | `src/app/sitemap.ts` | `/confidentialite` absente du sitemap | Ajouter avec priority 0.2 |
| M5 | Internationalisation | Pages SEO | `hreflang` définis inutilement sur un site monolingue | Supprimer `languages: { fr: '...' }` de tous les `alternates` |
| M6 | Performance | `src/app/layout.tsx:12-51` | 7 familles de polices chargées | Auditer lesquelles sont réellement utilisées |
| M7 | Structured Data | `src/components/landing/LandingJsonLd.tsx:26` | `SearchAction` pointe vers un blog sans recherche | Supprimer le `potentialAction` ou implémenter la recherche |
| M8 | Metadata | `src/app/blog/[slug]/page.tsx:135` | `dateModified` absent du JSON-LD Article | Ajouter `dateModified` |

---

## 9. Pages manquantes (opportunités SEO)

### `/tarifs`
**Priorité : Haute**
Le pricing n'est accessible que via la section Pricing de la landing page. Aucune URL dédiée n'existe pour les requêtes "tarif studra", "prix studra", "studra gratuit". Une page `/tarifs` permettrait de :
- Cibler ces requêtes directement
- Ajouter du JSON-LD `PriceSpecification` ou `Offer`
- Constituer une page de destination dédiée pour les campagnes publicitaires

### `/mentions-legales`
**Priorité : Haute (obligation légale)**
La loi française (LCEN, art. 6 III) impose des mentions légales sur tout site professionnel. Studra n'a pas de page `/mentions-legales`. Les CGU, CGV et politique de confidentialité existent, mais les mentions légales (identité de l'éditeur, hébergeur) sont distinctes. C'est aussi une page que Google vérifie pour évaluer la fiabilité d'un site.

---

## 10. Recommandations additionnelles

### Maillage interne
- Intégrer `<SeoLinks />` dans la landing page (voir I5 ci-dessus). Ces 4 liens vers les pages SEO sont cruciaux pour la diffusion du PageRank depuis la page la plus puissante du site.
- Le composant est prêt, il n'attend qu'une ligne d'import dans `src/app/page.tsx`.

### Structured Data — Pages features
Ajouter un bloc `SoftwareApplication` minimal sur chaque page SEO feature (similaire à celui de la landing) pour renforcer leur classification en tant que pages produit.

### Blog — `publishedAt` au format ISO
Les articles ont `publishedAt: '2026-04-10'` (format `YYYY-MM-DD`). Google préfère le format ISO 8601 complet : `2026-04-10T00:00:00+02:00`. C'est un détail mais cela améliore la fiabilité du parsing de date.

### Google Search Console
Vérifier que le sitemap est soumis et que les 4 pages SEO (`/flashcards-ia`, `/fiches-de-revision-ia`, `/repetition-espacee`, `/examen-blanc-ia`) sont correctement indexées. Les FAQPage rich results devraient être visibles dans les rapports d'enrichissements.

### Optimisation du budget crawl
Avec le flux d'affiliation et les nouveaux paramètres UTM potentiels (`?ref=xxx`), envisager d'ajouter `Clean-param: ref` à robots.txt ou de configurer la canonicalisation des URL avec paramètres.

---

*Rapport généré en lecture seule — aucune modification de code effectuée.*
