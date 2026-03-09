# Phase 03 — Core Web App
**Status:** Not started
**Depends on:** Phase 01 (scaffold), Phase 02 (database + auth)
**Blocks:** Phase 04 (community features), Phase 07 (SEO)

---

## Goal

Build the core web application: homepage feed, prompt submission, prompt pages, category browsing, and search. This is the primary user-facing product. At the end of this phase, a user can submit a prompt, find it on the homepage, click into its page, and search for other prompts.

---

## Context

See `learnings/session-001-product-direction.md` for product decisions.
See `learnings/session-002-tech-stack.md` for stack rationale.

Key constraints:
- Prompts are always fully visible — no paywalls, no preview truncation
- Copy-to-clipboard is the primary CTA on every prompt page
- Search uses Postgres `tsvector` (no Algolia yet)
- API layer is tRPC within Next.js

---

## Packages

```
@trpc/server
@trpc/client
@trpc/next
@trpc/react-query
@tanstack/react-query
zod
nanoid             ← ID generation
react-hot-toast    ← notifications
```

---

## Tasks

### 1. tRPC Setup

- Create `apps/web/server/trpc.ts` — base tRPC instance with context (session, db)
- Create `apps/web/server/routers/` directory
- Create root `appRouter` that merges all sub-routers
- Create `apps/web/app/api/trpc/[trpc]/route.ts` — tRPC HTTP handler
- Set up `TRPCProvider` in the root layout with React Query

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '../auth'
import { db } from '@toprompt/db'

export const createTRPCContext = async () => {
  const session = await auth()
  return { session, db }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.session.user } })
})
```

### 2. Prompt Router (`server/routers/prompts.ts`)

Implement these procedures:

```
prompts.list         — paginated feed, sorted by score (public)
prompts.byId         — single prompt by ID (public)
prompts.byCategory   — filtered by category (public)
prompts.search       — full-text search via tsvector (public)
prompts.create       — submit a new prompt (protected)
prompts.trending     — top prompts in last 24h (public)
```

**Search query using tsvector:**
```typescript
const results = await db
  .select()
  .from(prompts)
  .where(sql`search_vector @@ plainto_tsquery('english', ${query})`)
  .orderBy(sql`ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC`)
  .limit(20)
```

### 3. Homepage (`/`)

Layout:

```
[Navbar]
[Hero — tagline + search bar]
[Category filter tabs]
[Prompt feed — trending | recent toggle]
[Prompt cards]
[Load more / infinite scroll]
```

**Prompt card component** shows:
- Title
- Description (truncated to 2 lines)
- Category badge
- Model compatibility tags
- Upvote count + save count
- Creator avatar + username
- Time since posted

Homepage uses ISR with a 5-minute revalidation period — fast for SEO, fresh enough for leaderboards.

### 4. Prompt Submission (`/submit`)

Protected route (must be signed in).

Form fields:
- Title (required)
- Description (required)
- Prompt text (required — large textarea)
- Category (required — dropdown from enum)
- Tags (optional — comma-separated or tag input)
- Compatible models (multi-select: Claude 3.7, GPT-4o, o3, Gemini, etc.)
- Source URL (optional — attribution link)

Validation with Zod on both client and server.

On submit: optimistic UI update, redirect to the new prompt page.

### 5. Prompt Page (`/p/[id]`)

Layout:

```
[Breadcrumb: Category > Title]
[Title + metadata row]
  [Category badge] [Model tags] [Upvote btn] [Save btn]
[Creator card — avatar, username, follow btn]
[Source attribution link (if present)]

[Prompt text box]
  [Full visible text]
  [Copy to clipboard button — primary CTA]

[Usage instructions (if submitted)]
[Variable placeholders (if any — e.g. {{language}})]

[Comments section]
```

**Copy to clipboard** is the primary CTA. Large, prominent button. On copy: show toast "Copied to clipboard".

URL structure: `/p/[id]` with the prompt title as a slug suffix for SEO: `/p/senior-engineer-code-review-abc123`

### 6. Creator Profile Page (`/u/[username]`)

Layout:

```
[Avatar + username + bio]
[Stats: total upvotes | prompts | followers]
[Follow button]
[Prompt grid — the creator's submissions]
```

### 7. Category Pages (`/c/[category]`)

Static paths generated for all 8 categories.

Each category page:
- Title + description of the category
- Filtered prompt feed sorted by score
- Uses ISR with 10-minute revalidation

### 8. Search Page (`/search`)

- URL-driven: `/search?q=code+review`
- Search input updates the URL (no client-side state)
- Results from `prompts.search` tRPC procedure
- Shows result count
- Empty state with suggested categories

### 9. Navbar

```
[TopPrompt logo]     [Search bar]     [Submit Prompt] [Sign in / Avatar]
```

- Search bar navigates to `/search?q=...` on submit
- "Submit Prompt" → `/submit` (redirects to login if unauthenticated)
- Signed-in state: avatar dropdown with Profile, My Prompts, Sign Out

### 10. Input Validation & Error Handling

- All tRPC inputs validated with Zod schemas
- Form errors shown inline (not toast)
- Server errors shown as toast notifications
- 404 page for unknown prompt IDs and usernames

---

## Page Routes Summary

```
/                     Homepage feed
/submit               Prompt submission (protected)
/p/[id]               Prompt page
/u/[username]         Creator profile
/c/[category]         Category page
/search               Search results
/login                Auth page (from Phase 02)
```

---

## Acceptance Criteria

- [ ] tRPC procedures are type-safe end-to-end (client autocompletes server types)
- [ ] Homepage loads with a feed of prompts sorted by score
- [ ] Category filter tabs correctly filter the feed
- [ ] A signed-in user can submit a prompt and see it appear on the homepage
- [ ] Prompt page shows full text with a working copy-to-clipboard button
- [ ] Search returns relevant results using tsvector ranking
- [ ] Creator profile shows their submitted prompts
- [ ] Category pages are statically generated
- [ ] All routes return correct HTTP status codes (404 for missing resources)
- [ ] Forms validate with Zod and show inline errors

---

## Deliverables

- Fully functional web app covering all routes above
- tRPC router with all MVP procedures
- Reusable prompt card and prompt page components in `packages/ui`
