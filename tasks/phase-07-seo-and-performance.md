# Phase 07 — SEO & Performance
**Status:** Not started
**Depends on:** Phase 03 (core web app — pages must exist)
**Blocks:** Nothing (additive layer, can overlap with Phase 05/06)

---

## Goal

Make TopPrompt highly discoverable via search engines. Each prompt page should rank for long-tail queries like "best Claude prompt for code review" or "ChatGPT system prompt for debugging Python". At the end of this phase, all prompt pages are statically generated or ISR-cached, metadata is correct, sitemaps are generated, and Core Web Vitals are green.

---

## Context

See `learnings/session-001-product-direction.md`:
> Each prompt page is an SEO landing page. SEO is the primary organic growth channel.

This is a Next.js App Router project. Use:
- `generateStaticParams` for static generation of prompt/category pages
- `generateMetadata` for per-page metadata
- ISR (`revalidate`) for pages that need freshness

---

## Packages

```
next-sitemap           ← sitemap generation
schema-dts             ← TypeScript types for JSON-LD structured data
sharp                  ← image optimization (Next.js dependency)
```

---

## Tasks

### 1. Per-Page Metadata (`generateMetadata`)

Every page needs unique, keyword-rich `<title>` and `<meta description>`.

**Prompt page (`/p/[id]`):**
```typescript
export async function generateMetadata({ params }: { params: { id: string } }) {
  const prompt = await getPromptById(params.id)
  return {
    title: `${prompt.title} — TopPrompt`,
    description: prompt.description.slice(0, 155),
    openGraph: {
      title: prompt.title,
      description: prompt.description.slice(0, 155),
      type: 'article',
      url: `https://topprompt.dev/p/${params.id}`,
      images: [{ url: `https://topprompt.dev/api/og?title=${encodeURIComponent(prompt.title)}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description: prompt.description.slice(0, 155),
    },
    alternates: {
      canonical: `https://topprompt.dev/p/${params.id}`,
    },
  }
}
```

**Category page (`/c/[category]`):**
```typescript
// Title: "Best Coding AI Prompts — TopPrompt"
// Description: "Discover the top community-ranked AI prompts for coding, reviewed by developers."
```

**Creator page (`/u/[username]`):**
```typescript
// Title: "{username}'s AI Prompts — TopPrompt"
```

### 2. Open Graph Image Generation

Dynamic OG images via Next.js Edge Runtime + `@vercel/og`.

Route: `GET /api/og`

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'TopPrompt'
  const category = searchParams.get('category') ?? ''

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', width: '100%', height: '100%', padding: 60 }}>
        <div style={{ color: '#6366f1', fontSize: 24, marginBottom: 16 }}>TopPrompt</div>
        <div style={{ color: 'white', fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        {category && <div style={{ color: '#94a3b8', fontSize: 24, marginTop: 24 }}>{category}</div>}
        <div style={{ color: '#475569', fontSize: 18, marginTop: 'auto' }}>The developer's prompt library</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

### 3. JSON-LD Structured Data

Add structured data to prompt pages for rich results in Google.

```typescript
// In prompt page component
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: prompt.title,
  description: prompt.description,
  author: {
    '@type': 'Person',
    name: prompt.creator.username,
    url: `https://topprompt.dev/u/${prompt.creator.username}`,
  },
  datePublished: prompt.createdAt.toISOString(),
  dateModified: prompt.updatedAt.toISOString(),
  url: `https://topprompt.dev/p/${prompt.id}`,
}

// In the page JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### 4. Static Generation & ISR

| Page | Strategy | Revalidate |
|---|---|---|
| `/p/[id]` | ISR | 300s (5 min) |
| `/c/[category]` | ISR | 600s (10 min) |
| `/u/[username]` | ISR | 300s (5 min) |
| `/leaderboard` | ISR | 300s (5 min) |
| `/` (homepage) | ISR | 300s (5 min) |
| `/search` | Dynamic (SSR) | No cache |

For `/p/[id]`, use `generateStaticParams` to pre-render the top 1000 prompts at build time:

```typescript
export async function generateStaticParams() {
  const top1000 = await db.select({ id: prompts.id })
    .from(prompts)
    .orderBy(desc(prompts.score))
    .limit(1000)
  return top1000.map(p => ({ id: p.id }))
}
```

### 5. Sitemap

Use `next-sitemap` to auto-generate `sitemap.xml` and `robots.txt`.

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://topprompt.dev',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/saved', '/submit'],
  additionalPaths: async (config) => {
    // Fetch all prompt IDs for sitemap
    const allPrompts = await db.select({ id: prompts.id, updatedAt: prompts.updatedAt }).from(prompts)
    return allPrompts.map(p => ({
      loc: `/p/${p.id}`,
      lastmod: p.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    }))
  },
}
```

Run sitemap generation as part of the build step in `turbo.json`.

### 6. `robots.txt`

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /saved
Disallow: /submit

Sitemap: https://topprompt.dev/sitemap.xml
```

### 7. Canonical URLs

Every page must have a canonical URL to prevent duplicate content issues (pagination, query params, etc.).

For prompt pages with slug + ID: `https://topprompt.dev/p/senior-engineer-code-review-abc123` — the canonical always points to this slug form.

### 8. Core Web Vitals

Run Lighthouse against key pages and fix any issues:

**LCP (Largest Contentful Paint) — target < 2.5s:**
- Ensure hero section and above-the-fold prompt cards use `priority` on Next.js Image components
- Homepage prompt feed uses SSR or ISR (not client-side fetch)

**CLS (Cumulative Layout Shift) — target < 0.1:**
- All image elements have explicit `width` and `height`
- Font loading uses `next/font` to prevent FOUT

**INP (Interaction to Next Paint) — target < 200ms:**
- Upvote and copy interactions are optimistic (no waiting for server)
- Heavy components (comment section) are lazy-loaded below the fold

**Font setup:**
```typescript
// apps/web/app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

### 9. SEO-Friendly URL Slugs

Prompt page URLs use a slug derived from the title + short ID:

```
/p/senior-engineer-code-review-abc123
```

Slug generation:
```typescript
function generateSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${slug}-${id.slice(0, 7)}`
}
```

Store the `slug` on the `prompts` table. Add a unique index on `slug`.

### 10. Target Keyword Strategy

Each category page targets cluster keywords. Ensure h1 tags and descriptions match:

| Category | Target Keywords |
|---|---|
| Coding | "best AI prompts for coding", "ChatGPT prompt for code review" |
| Debugging | "AI prompt for debugging", "Claude debugging prompt" |
| Architecture | "system design prompt AI", "software architecture prompt" |
| DevOps | "AI prompt for DevOps", "Claude prompt for Dockerfile" |
| Startup | "AI prompt for startup founders", "product prompt AI" |
| Writing for Devs | "AI prompt for README", "technical writing prompt" |

---

## Acceptance Criteria

- [ ] Every prompt page has unique `<title>` and `<meta description>`
- [ ] OG images generate correctly (test with opengraph.xyz)
- [ ] JSON-LD structured data validates in Google's Rich Results Test
- [ ] `sitemap.xml` is accessible at `https://topprompt.dev/sitemap.xml`
- [ ] `robots.txt` correctly allows prompt pages and blocks `/api/`
- [ ] Lighthouse score ≥ 90 on Performance, SEO, and Accessibility for `/p/[id]`
- [ ] No CLS issues on prompt pages (score < 0.1)
- [ ] Canonical URLs are set on all pages
- [ ] Homepage ISR revalidates within 5 minutes of a score change

---

## Deliverables

- `generateMetadata` on all public pages
- Dynamic OG image API route
- JSON-LD on prompt pages
- `next-sitemap` configured and running in CI
- Lighthouse audit results documented
- Slug column added to `prompts` table with migration
