# Next.js Best Practices — Studra

Reference for all AI agents working on this codebase. Apply these rules when writing or reviewing Next.js code.
Stack: Next.js 16, React 19, TypeScript strict, App Router, Supabase, Vercel.

---

## File Conventions

### Special files (App Router)

| File | Purpose |
|------|---------|
| `page.tsx` | UI for a route segment |
| `layout.tsx` | Shared UI for segment and children |
| `loading.tsx` | Loading UI (automatic Suspense boundary) |
| `error.tsx` | Error UI — must be `'use client'` |
| `not-found.tsx` | 404 UI |
| `global-error.tsx` | Root layout error — must include `<html>` and `<body>` |
| `route.ts` | API endpoint |
| `template.tsx` | Like layout but re-renders on navigation |
| `default.tsx` | Fallback for parallel routes |

### Route segments

```
app/
├── blog/               # Static: /blog
├── [slug]/             # Dynamic: /:slug
├── [...slug]/          # Catch-all: /a/b/c
├── [[...slug]]/        # Optional catch-all
└── (marketing)/        # Route group (ignored in URL)
```

### Private folders

Prefix with `_` to exclude from routing: `_components/`, `_lib/`.

### Middleware (Next.js 16)

In Next.js 16, middleware is renamed from `middleware.ts` to `proxy.ts`:

```ts
// proxy.ts (root)
export function proxy(request: NextRequest) {
  return NextResponse.next()
}
export const config = { matcher: ['/dashboard/:path*'] }
```

---

## RSC Boundaries

### Async client components are invalid

Client components **cannot** be async. Only Server Components can.

```tsx
// Bad
'use client'
export default async function UserProfile() { ... }

// Good: fetch in server parent, pass data as props
export default async function Page() {
  const user = await getUser()
  return <UserProfile user={user} />
}
```

### Non-serializable props from Server → Client

Props must be JSON-serializable. These types cannot cross the boundary:
- Functions (except Server Actions with `'use server'`)
- `Date` objects → serialize with `.toISOString()`
- `Map`, `Set` → convert to `Object.fromEntries()` / `Array.from()`
- Class instances → pass plain objects
- `Symbol`, circular references

```tsx
// Bad
<PostCard createdAt={post.createdAt} />  // Date object

// Good
<PostCard createdAt={post.createdAt.toISOString()} />
```

### Server Actions are the exception

Functions marked `'use server'` CAN be passed to client components.

---

## Async Patterns (Next.js 15+)

`params`, `searchParams`, `cookies()`, and `headers()` are async. Always await them.

### Pages and layouts

```tsx
type Props = { params: Promise<{ slug: string }> }

export default async function Page({ params }: Props) {
  const { slug } = await params
}
```

### Route handlers

```tsx
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

### searchParams

```tsx
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query?: string }>
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { query } = await searchParams
}
```

### Non-async components

Use `React.use()`:

```tsx
import { use } from 'react'
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
}
```

### cookies and headers

```tsx
import { cookies, headers } from 'next/headers'
const cookieStore = await cookies()
const headersList = await headers()
```

---

## Runtime Selection

Default to Node.js. Only use Edge if there is a specific latency requirement and all dependencies are Edge-compatible.

```tsx
// Good: no config needed, uses Node.js by default
export default function Page() { ... }

// Caution: only if specifically required
export const runtime = 'edge'
```

**Never use `runtime = 'edge'` on OG images** — use the Node.js default.

---

## Directives

### `'use client'`

Required for: React hooks (`useState`, `useEffect`), event handlers, browser APIs.
Must be the first line of the file.

### `'use server'`

Marks a function as a Server Action. Can be used at file level or inline:

```tsx
// File-level (actions.ts)
'use server'
export async function submitForm(formData: FormData) { ... }

// Inline in Server Component
export default function Page() {
  async function submit() {
    'use server'
    // server-side logic
  }
  return <form action={submit}>...</form>
}
```

### `'use cache'`

Marks a function or component for caching (requires `cacheComponents: true` in `next.config.ts`).

---

## Functions

### Navigation — always use `next/link` for internal routes

```tsx
// Bad
<a href="/about">About</a>

// Good
import Link from 'next/link'
<Link href="/about">About</Link>
```

### generateStaticParams

```tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

### generateMetadata

```tsx
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title }
}
```

---

## Error Handling

### `error.tsx` — must be `'use client'`

```tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### `global-error.tsx` — must include `<html>` and `<body>`

```tsx
'use client'
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

### Never wrap `redirect()` / `notFound()` in try-catch

These functions throw internally. Catching them breaks navigation.

```tsx
// Bad
async function createPost(formData: FormData) {
  try {
    const post = await db.post.create({ ... })
    redirect(`/posts/${post.id}`)  // caught here — navigation fails!
  } catch (error) {
    return { error: 'Failed' }
  }
}

// Good: call navigation APIs outside try-catch
async function createPost(formData: FormData) {
  let post
  try {
    post = await db.post.create({ ... })
  } catch (error) {
    return { error: 'Failed' }
  }
  redirect(`/posts/${post.id}`)
}

// Good: use unstable_rethrow
import { unstable_rethrow } from 'next/navigation'
async function action() {
  try {
    redirect('/success')
  } catch (error) {
    unstable_rethrow(error)
    return { error: 'Something went wrong' }
  }
}
```

Same rule applies to `redirect()`, `permanentRedirect()`, `notFound()`, `forbidden()`, `unauthorized()`.

---

## Data Patterns

### Decision tree

```
Need to fetch data?
├── In a Server Component → fetch directly (no API needed)
├── Mutation from UI → Server Action
├── External webhook / third-party API → Route Handler
└── Public REST API → Route Handler
```

### Server Components for reads (preferred)

```tsx
async function UsersPage() {
  const users = await db.user.findMany()  // direct DB access, no API
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### Server Actions for mutations (preferred over fetch to route handler)

```tsx
'use server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') as string } })
  revalidatePath('/posts')
}
```

### Avoid sequential data waterfalls

```tsx
// Bad: sequential
const user = await getUser()
const posts = await getPosts()

// Good: parallel
const [user, posts] = await Promise.all([getUser(), getPosts()])
```

### Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserSection />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />
      </Suspense>
    </div>
  )
}
```

### Preload pattern

```tsx
import { cache } from 'react'

export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }))
export const preloadUser = (id: string) => { void getUser(id) }
```

---

## Route Handlers

### Basic usage

```tsx
// app/api/users/route.ts
export async function GET() {
  const users = await getUsers()
  return Response.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await createUser(body)
  return Response.json(user, { status: 201 })
}
```

### `route.ts` and `page.tsx` cannot coexist at the same path

```
// Bad: conflict
app/users/page.tsx
app/users/route.ts

// Good: separate paths
app/users/page.tsx
app/api/users/route.ts
```

### When to use Route Handlers vs Server Actions

| Use Case | Route Handlers | Server Actions |
|----------|----------------|----------------|
| Form submissions | No | Yes |
| Mutations from UI | No | Yes |
| External webhooks | Yes | No |
| Public REST API | Yes | No |
| Third-party integrations | Yes | No |

---

## Metadata & OG Images

### Metadata only works in Server Components

`metadata` and `generateMetadata` cannot be exported from a `'use client'` file.

### Static metadata

```tsx
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Description',
}
```

### Avoid duplicate fetches with `cache()`

```tsx
import { cache } from 'react'

export const getPost = cache(async (slug: string) => {
  return await db.posts.findFirst({ where: { slug } })
})

// Used in both generateMetadata and the page — fetches only once
export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)  // cache hit, no extra request
  return <div>{post.title}</div>
}
```

### OG Images — always use `next/og`, never `@vercel/og`, never `runtime = 'edge'`

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'  // correct import

export const alt = 'Site Name'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// No runtime = 'edge' here

export default function Image() {
  return new ImageResponse(<div style={{ ... }}>Hello</div>, { ...size })
}
```

---

## Image Optimization

### Always use `next/image`, never `<img>`

```tsx
// Bad
<img src="/hero.png" alt="Hero" />

// Good
import Image from 'next/image'
<Image src="/hero.png" alt="Hero" width={800} height={400} />
```

### `fill` requires `sizes`

```tsx
// Bad: downloads largest image variant
<Image src="/hero.png" alt="Hero" fill />

// Good
<Image src="/hero.png" alt="Hero" fill sizes="100vw" />
<Image src="/card.png" alt="Card" fill sizes="(max-width: 768px) 100vw, 33vw" />
```

### `priority` on LCP images

```tsx
<Image src="/hero.png" alt="Hero" fill priority />
```

### Remote images require `remotePatterns` in `next.config.ts`

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'example.com', pathname: '/images/**' },
  ],
}
```

---

## Font Optimization

### Always use `next/font`, never `<link>` to Google Fonts

```tsx
// Bad
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />

// Bad
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter');

// Good
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

### Define fonts once in `app/layout.tsx` or `lib/fonts.ts`

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Always specify `subsets`

```tsx
// Bad: loads all character sets
const inter = Inter({})

// Good
const inter = Inter({ subsets: ['latin'] })
```

---

## Bundling

### Server-incompatible packages

```tsx
// Bad: uses window — fails in Server Component
import SomeChart from 'some-chart-library'

// Good: client-only dynamic import
import dynamic from 'next/dynamic'
const SomeChart = dynamic(() => import('some-chart-library'), { ssr: false })
```

### Packages with native bindings → `serverExternalPackages`

```ts
// next.config.ts
serverExternalPackages: ['sharp', 'bcrypt', 'canvas', 'pdf-parse']
```

### ESM packages → `transpilePackages`

```ts
transpilePackages: ['some-esm-only-package']
```

---

## Scripts

### Always use `next/script`, never native `<script>`

```tsx
// Bad
<script src="https://example.com/script.js"></script>

// Good
import Script from 'next/script'
<Script src="https://example.com/script.js" />
```

### Inline scripts require `id`

```tsx
// Bad
<Script>{'console.log("hi")'}</Script>

// Good
<Script id="my-script">{'console.log("hi")'}</Script>
```

### Do not place `<Script>` inside `<Head>`

```tsx
// Bad
<Head><Script src="/analytics.js" /></Head>

// Good
<Head><title>Page</title></Head>
<Script src="/analytics.js" />
```

### Google Analytics / GTM → use `@next/third-parties`

```tsx
// Bad: manual inline scripts
// Good
import { GoogleAnalytics } from '@next/third-parties/google'
<GoogleAnalytics gaId="G-XXXXX" />
```

---

## Hydration Errors

Common causes and fixes:

### Browser-only APIs

```tsx
// Bad: window doesn't exist on server
<div>{window.innerWidth}</div>

// Good: guard in useEffect
'use client'
const [width, setWidth] = useState<number>()
useEffect(() => setWidth(window.innerWidth), [])
```

### Date/time rendering

```tsx
// Bad: server and client timezones may differ
<span>{new Date().toLocaleString()}</span>

// Good: render client-only
const [time, setTime] = useState<string>()
useEffect(() => setTime(new Date().toLocaleString()), [])
```

### Random values → use `useId()`

```tsx
// Bad
<div id={Math.random().toString()}>

// Good
import { useId } from 'react'
const id = useId()
<input id={id} />
```

### Invalid HTML nesting

```tsx
// Bad: div inside p, p inside p
<p><div>Content</div></p>

// Good
<div><p>Content</p></div>
```

---

## Suspense Boundaries

### `useSearchParams()` always requires Suspense

```tsx
// Bad: entire page becomes CSR
'use client'
export default function SearchBar() {
  const searchParams = useSearchParams()
  return <div>{searchParams.get('q')}</div>
}

// Good: wrap in Suspense in the parent
import { Suspense } from 'react'
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchBar />
    </Suspense>
  )
}
```

### `usePathname()` requires Suspense on dynamic routes without `generateStaticParams`

```tsx
// Wrap in Suspense when used in dynamic routes
<Suspense fallback={<BreadcrumbSkeleton />}>
  <Breadcrumb />
</Suspense>
```

| Hook | Suspense Required |
|------|-------------------|
| `useSearchParams()` | Always |
| `usePathname()` | On dynamic routes without `generateStaticParams` |
| `useParams()` | No |
| `useRouter()` | No |

---

## Parallel & Intercepting Routes

### Every `@slot` folder needs a `default.tsx`

Without `default.tsx`, hard navigation (refresh, direct URL) returns 404.

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null
}
```

### Close modals with `router.back()`, never `router.push()`

```tsx
// Bad: adds history entry, modal may flash
router.push('/')

// Good: restores previous route cleanly
router.back()
```

### Intercepting route matchers

| Matcher | Matches |
|---------|---------|
| `(.)` | Same level |
| `(..)` | One level up |
| `(...)` | From root |

---

## Self-Hosting (not applicable — deployed on Vercel)

If `output: 'standalone'` or `cacheHandler` appear in `next.config.ts`, investigate before keeping them — they're not needed for Vercel deployments.
