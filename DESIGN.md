# Studra — Design System de la Landing Page

> Référence exhaustive du design utilisé sur `src/app/page.tsx` (landing publique).
> Système actif : **`.landing-v2`** (thème clair), défini dans `src/app/globals.css` (lignes ~460-669) et appliqué via la classe racine `<div className="landing-v2">` dans `page.tsx`.
>
> ⚠️ Il existe un ancien design system **dark** dans le même `globals.css` (lignes 1-460, `--color-bg: #07070b`, classes `.btn`, `.hero-bg`...) encore utilisé par d'autres pages (blog, changelog). Il est hors-scope de ce document, mais des overrides `.landing-v2 .xxx { ... !important }` (lignes 648-669) re-stylent au vol les composants qui utilisent encore d'anciennes classes Tailwind (ex. `SeoLinks.tsx`) pour rester cohérents avec la palette claire.

---

## 1. Architecture

```
src/app/page.tsx
└── <div className="landing-v2">
    ├── <LandingJsonLd />
    ├── <Nav />
    └── <main>
        ├── <Hero />
        ├── <HowItWorks />
        ├── <Features />
        ├── <Method />
        ├── <Pricing />
        ├── <FAQ />
        ├── <SeoLinks />
        └── <FinalCTA />
    └── <Footer />
```

Tailwind v4 (CSS-first, pas de `tailwind.config.js`). Pas de librairie de composants UI partagée (`shadcn` etc.) : tout le styling repose sur des classes utilitaires custom (`.btn`, `.sec`, `.eyebrow`, `.lede`, `.dim`...) définies dans `globals.css`, complétées par du `style={{}}` inline et des variables CSS.

---

## 2. Typographie

Polices déclarées via `next/font/google` dans `src/app/layout.tsx` :

| Variable CSS | Police | Usage |
|---|---|---|
| `--font-geist` | Geist (300/400/500/600) | **Police principale de la landing** (sans-serif) |
| `--font-geist-mono` | Geist Mono (400/500) | Mono : eyebrows, labels, prix, badges |
| `--font-serif` | Instrument Serif | Non utilisé sur la landing v2 (legacy) |
| `--font-mono` | JetBrains Mono | Non utilisé sur la landing v2 (legacy) |
| `--font-dm-sans` | DM Sans | Non utilisé sur la landing v2 (legacy) |

```css
.landing-v2 { font-family: var(--font-geist), system-ui, sans-serif; }
.landing-v2 .mono       { font-family: var(--font-geist-mono), monospace; }
.landing-v2 .font-serif { font-family: var(--font-geist), system-ui, sans-serif !important; } /* override legacy */
.landing-v2 .font-mono  { font-family: var(--font-geist-mono), monospace !important; }        /* override legacy */
```

→ **Toute la landing utilise Geist (texte) + Geist Mono (labels/eyebrows)**, malgré la présence d'autres polices ailleurs dans l'app.

### Échelle typographique

| Élément | Taille | Poids | Letter-spacing | Line-height |
|---|---|---|---|---|
| H1 Hero | `clamp(40px, 6.4vw, 78px)` | 500 | `-0.035em` | `0.96` |
| H2 `.section-h` (titres de section) | `clamp(34px, 4.4vw, 52px)` | 500 | `-0.03em` | `1.02` |
| Titre FinalCTA | `clamp(40px, 7vw, 88px)` | 500 | `-0.04em` | `0.95` |
| H3 (ex. Method) | `26px` | 500 | `-0.025em` | normal |
| Titre carte Bento (Features) | `24px` | 500 | `-0.025em` | normal |
| Titre étape HowItWorks | `22px` | 500 | `-0.025em` | normal |
| Prix (Pricing) | `52px` | 500 | `-0.035em` | `tnum` (fonts-feature) |
| `.lede` (chapô/intro) | `18px` | 400 | normal | `1.6` |
| Body Method | `17px` | 400 | normal | `1.65` |
| Body carte (Features) | `14.5px` | 400 | normal | normal |
| `.eyebrow` (label section) | `11.5px` | 500 | `0.16em` (uppercase) | normal |
| Footer titre colonne | `11px` mono | 500 | `0.16em` (uppercase) | normal |
| FAQ question | `17.5px` | 500 | `-0.015em` | normal |

**Pattern récurrent** : titre coupé en 2 lignes, la 2e atténuée via la classe `.dim` (`color: var(--ink-400)`). Utilisé dans Hero, HowItWorks, Features, FinalCTA, Pricing, FAQ.

---

## 3. Couleurs

Variables CSS définies dans `.landing-v2` (`src/app/globals.css`) :

```css
.landing-v2 {
  --bg:          #FAFAF9;   /* fond de page */
  --bg-elev:     #FFFFFF;   /* fond surélevé : cards, nav au scroll */
  --ink:         #18181B;   /* texte principal / titres */
  --ink-700:     #3F3F46;   /* texte body / secondaire */
  --ink-500:     #71717A;   /* labels, eyebrows, sous-textes */
  --ink-400:     #A1A1AA;   /* texte mute, 2e ligne de titre (.dim) */
  --ink-200:     #E4E4E7;   /* bordures, séparateurs */
  --line:        rgba(228, 228, 231, 0.6);  /* bordures translucides (cards) */
  --dark:        #09090B;   /* fond sombre (section FinalCTA uniquement) */
  --light:       #F5F5F4;   /* texte clair sur fond sombre */
  --accent:      #1F4D3F;   /* vert forêt — couleur de marque unique, CTA */
  --accent-fg:   #FFFFFF;   /* texte sur fond accent */
  --accent-soft: rgba(31, 77, 63, 0.08);  /* fond accent léger (badges/pills) */
}
```

### Usage sémantique

- **`--accent` (#1F4D3F, vert forêt)** : couleur de marque unique — boutons primaires, points de progression, liens actifs, checks de pricing, highlights dans les mini-démos produit. Pas de couleur secondaire/violette : la marque repose sur une seule teinte forte.
- **`--ink-*`** : échelle de gris/texte à 5 niveaux (du plus foncé `--ink` au plus clair `--ink-400`), utilisée systématiquement pour hiérarchiser titres > body > labels > texte discret.
- **`--dark` / `--light`** : réservés à la seule section **FinalCTA**, qui rompt avec le fond clair du reste de la page pour créer un climax visuel en fin de parcours.
- **Couleurs ad hoc (hors variables)**, utilisées uniquement dans les mini-animations produit du Bento grid (planning) :
  ```js
  { green: "rgba(31,77,63,.85)" /* = accent */, blue: "rgba(29,78,216,.65)", orange: "rgba(194,65,12,.7)" }
  ```

---

## 4. Layout & structure

```css
.landing-v2 .container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
@media (max-width: 720px) { .landing-v2 .container { padding: 0 20px; } }

.landing-v2 .sec { padding: 96px 0; }
@media (max-width: 900px) { .landing-v2 .sec { padding: 72px 0; } }
```

**Pattern de section standard** (Hero excepté) :
```tsx
<section className="sec" id="...">
  <div className="container">
    <div className="eyebrow"><span className="eyebrow-dot" /><span>LABEL</span></div>
    <h2 className="section-h">Titre.<br/><span className="dim">Sous-titre atténué.</span></h2>
    {/* contenu */}
  </div>
</section>
```

### Breakpoints observés
- `1023px` : passage Hero en 1 colonne (mobile/tablette)
- `900px` : breakpoint général desktop → mobile (grids en 1 colonne, padding section réduit, burger menu)
- `767px` : mobile (H1 réduit, CTA full-width)
- `720px` : padding container réduit
- `440px` / `760px` : steps intermédiaires de la grille Footer

### Border-radius (échelle)
| Usage | Valeur |
|---|---|
| Boutons | `10px` |
| Boutons larges (FinalCTA) | `12px` |
| Cards SEO links | `14-18px` |
| Cards Pricing | `24px` |
| Cards Bento (Features) | `28px` |
| Pills / badges | `999px` |

---

## 5. Composants

### 5.1 Boutons (`.btn`)

```css
.landing-v2 .btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 500;
  padding: 14px 22px; border-radius: 10px;
  border: 1px solid transparent;
  transition: transform 200ms cubic-bezier(0.2,0.7,0.3,1), background 150ms ease, box-shadow 150ms ease;
  white-space: nowrap;
}
.landing-v2 .btn:hover  { transform: translateY(-1px); }
.landing-v2 .btn:active { transform: scale(0.98); }
```

| Variante | Style | Hover | Usage |
|---|---|---|---|
| `.btn-primary` | `background: var(--accent); color: var(--accent-fg)` | `background: #174038; box-shadow: 0 4px 16px -4px rgba(31,77,63,.5)` | CTA principal (Hero, Nav, FinalCTA, Pricing Pro) |
| `.btn-outline` | `transparent; border: 1px solid var(--ink-200)` | `background: rgba(0,0,0,.03); border-color: var(--ink-400)` | CTA secondaire (Pricing Free, Features "voir plus") |
| `.btn-ghost` | `transparent`, pas de bordure | `background: rgba(0,0,0,.04)` | Action tertiaire (Nav "Se connecter") |

Tailles ajustées par contexte : Nav (`padding: 10px 16px, fontSize: 14`), FinalCTA (`padding: 20px 32px, fontSize: 16, borderRadius: 12`).

### 5.2 Eyebrow (label de section)

```css
.landing-v2 .eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 11.5px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-500);
}
.landing-v2 .eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  animation: lp-dot-pulse 2s ease-in-out infinite;
}
```
Ex. : "POUR LE BAC 2026 ET APRÈS", "TARIFS", "QUESTIONS FRÉQUENTES", "COMMENT ÇA MARCHE".

### 5.3 Cards Bento (Features)
`background: var(--bg-elev); border: 1px solid var(--line); border-radius: 28px; padding: 32px; min-height: 340px`. Grid `repeat(3, 1fr)` avec `span 2`/`span 1` selon contenu, `1fr` en mobile (<900px).

### 5.4 Cards Pricing
`border-radius: 24px; padding: 40px`. Plan recommandé (Pro) : bordure `1px solid var(--accent)` + `box-shadow: 0 0 0 1px var(--accent) inset`. Badge "Recommandé" en mono uppercase 10.5px, tracking `.14em`, couleur accent, positionné top-right.

### 5.5 FAQ (accordéon custom)
Bouton question : `17.5px / 500 / -0.015em`, icône `Plus`/`Minus` (Phosphor, 18px) selon état. Réponse animée en hauteur/opacité via `framer-motion`. Séparateurs `1px solid var(--ink-200)`.

### 5.6 Texte utilitaire
```css
.landing-v2 .lede { font-size: 18px; font-weight: 400; line-height: 1.6; color: var(--ink-700); }
.landing-v2 .dim  { color: var(--ink-400); }
```

---

## 6. Iconographie

- **`@phosphor-icons/react`** (`weight="regular"`) : librairie d'icônes principale de la landing — `Check`, `Plus`, `Minus`, `ArrowRight`, `List`, `X`, `FileText`, `YoutubeLogo`.
- `lucide-react` est présente dans le projet mais **non utilisée par la landing v2 active** (réservée au dashboard / anciens composants non importés).

---

## 7. Animations

- **Librairie principale** : `framer-motion`, pattern quasi systématique pour l'apparition au scroll :
  ```tsx
  useInView({ once: true, margin: "-80px" })
  initial={{ opacity: 0, y: 24 à 32 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.65-0.8, ease: [0.2, 0.7, 0.3, 1] }}
  // stagger : delay: index * 0.07 à 0.15
  ```
- **Keyframes CSS globales** (`globals.css`) :
  - `lp-dot-pulse` : pulsation du point `.eyebrow-dot`
  - `lp-shimmer` : effet skeleton/loading
  - `lp-blink` : curseur caret (mini-démos type terminal)
- **Mini-animations produit** (Bento cards : flashcards, socrate, fiches, schémas, examen, planning, rappel) : codées à la main via `setInterval`/`requestAnimationFrame`, sans lib externe — typewriter, reveal séquentiel, compteurs animés.
- `prefers-reduced-motion: reduce` est respecté (Hero, MockupWindow, animations globales).
- Hero : SVG décoratif "courbe d'Ebbinghaus" tracé via `stroke-dashoffset` (`@keyframes ebb-draw`, 2.6s, opacity 0.15).
- Mockup produit (Hero) : fenêtre en perspective 3D (`perspective: 1800px; rotateY(-3deg) rotateX(2deg)`), contenu animé en boucle entre 4 scènes (Import → Génération → Révision → Planning) via `AnimatePresence mode="wait"`, durées 4500-5000ms.

---

## 8. Spacing — récapitulatif

| Élément | Valeur |
|---|---|
| `.sec` (section générique) | `96px 0` (`72px 0` < 900px) |
| Method | `120px 0 100px` |
| FinalCTA | `140px 0` (`96px` mobile) |
| Footer | `80px 0 32px` |
| `.container` | `max-width: 1280px; padding: 0 32px` (`0 20px` < 720px) |
| Marge tête de section → contenu | `48-80px` |
| Gap interne carte/colonne | `8-24px` |

---

## 9. Ton & copywriting

- Français, **tutoiement systématique** ("Colle ton cours", "Tu peux annuler...").
- Titres courts en 2 lignes, 2e ligne atténuée (`.dim`) — pattern répété sur quasi toutes les sections.
- Pas d'emojis (seul `⌁` apparaît comme glyphe décoratif dans la barre d'URL du mockup produit).
- Eyebrows toujours en majuscules mono trackées.
- Ton direct, parfois sec/humoristique (FAQ : *"Studra remplace mon prof ? — Non."*), orienté bénéfice concret plutôt que survente (*"Annulable à tout moment. Pas d'engagement."*).
- Exemples de titres : *"Réviser sérieusement. Sans y passer ses nuits."* (Hero) · *"Trois étapes. Pas plus."* (HowItWorks) · *"Un cours. Sept manières de le réviser."* (Features) · *"Tes examens arrivent. Studra aussi."* (FinalCTA).

---

## 10. Fichiers de référence

| Fichier | Rôle |
|---|---|
| `src/app/page.tsx` | Composition de la landing |
| `src/app/layout.tsx` | Déclaration des polices (`next/font`) |
| `src/app/globals.css` | Tokens couleur, utilitaires `.landing-v2` (lignes ~460-669) |
| `src/components/landing/nav/Nav.tsx` | Header fixe, drawer mobile |
| `src/components/landing/hero/Hero.tsx`, `MockupWindow.tsx`, `scenes/*.tsx` | Hero + mockup produit animé |
| `src/components/landing/HowItWorks.tsx` | 3 étapes |
| `src/components/landing/features/Features.tsx`, `Anim*.tsx` | Bento grid + mini-démos |
| `src/components/landing/Method.tsx` | Méthode (rail sticky) |
| `src/components/landing/Pricing.tsx` | Plans Free/Pro |
| `src/components/landing/FAQ.tsx` | Accordéon |
| `src/components/landing/SeoLinks.tsx` | Liens SEO (legacy classes Tailwind, re-stylées via overrides) |
| `src/components/landing/FinalCTA.tsx` | Section sombre de clôture |
| `src/components/landing/Footer.tsx` | Pied de page |

---

## 11. Points d'attention / incohérences notées

- `SeoLinks.tsx` est le seul composant encore écrit en classes Tailwind brutes héritées de l'ancien système (`font-serif`, `border-line`, `bg-gradient-to-b from-surface to-bg-2`) — fonctionnel grâce aux overrides `!important` de `.landing-v2`, mais à migrer vers le style des autres composants pour cohérence du codebase.
- Certaines couleurs neutres (`#FAFAF9`, `#FFFFFF`, `#FCFCFB`, `#E4E4E7`) sont codées en dur dans quelques composants de mockup/animation plutôt que via `var(--bg)`/`var(--bg-elev)`/etc. — à corriger si on veut une stricte source de vérité unique sur les tokens couleur.
- Deux libs d'icônes cohabitent dans le projet (`@phosphor-icons/react` actif sur la landing, `lucide-react` présent mais inutilisé ici) — pas un problème en soi mais à garder en tête pour ne pas mélanger les deux dans de futurs composants de la landing.
