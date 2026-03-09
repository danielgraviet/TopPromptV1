# Session 002 — Tech Stack Decisions
**Date:** March 8, 2026
**Status:** Decided — ready to scaffold

---

## Guiding Principles

* TypeScript end-to-end — schema changes break at compile time, not runtime
* Serverless-first — no idle cost during early low-traffic days
* Monorepo — web app and Chrome extension share types, DB schema, and API client
* Clear upgrade path — every choice has a known migration route at scale
* Cheap to start — most of this stack is free or near-free at MVP scale

---

## Repo Structure

Turborepo monorepo with pnpm workspaces.

```
apps/
  web/          ← Next.js app
  extension/    ← Chrome extension (Plasmo)
packages/
  db/           ← Drizzle schema + migrations (shared)
  ui/           ← shared component library (shadcn/ui base)
  types/        ← shared TypeScript types
```

---

## Full Stack

| Layer | Tool | Notes |
|---|---|---|
| Monorepo | Turborepo + pnpm | Build caching, shared packages |
| Language | TypeScript | End-to-end, non-negotiable |
| Web framework | Next.js 14+ (App Router) | SSR/ISR for SEO on prompt pages |
| Styling | Tailwind CSS | Already decided |
| Components | shadcn/ui | Unstyled primitives you own, no lock-in |
| Chrome extension | Plasmo | React + TypeScript, Manifest V3, HMR |
| API layer | tRPC | Type-safe RPC within Next.js, no schema maintenance |
| Auth | Auth.js v5 | GitHub primary, Google secondary. Free, OSS, Drizzle adapter |
| ORM | Drizzle | Lighter than Prisma, SQL-close, TypeScript-native |
| Database | PostgreSQL on Neon | Serverless Postgres, DB branching per PR, built-in pooling |
| Search (MVP) | Postgres tsvector + GIN index | Covers title, description, tags, prompt_text |
| Search (scale) | Meilisearch | OSS, self-hostable on Railway, typo tolerance, faceted filtering |
| Cache + rate limiting | Upstash Redis | Serverless Redis, pay per request, Vercel Edge compatible |
| Background jobs | Inngest | Serverless job queue for aggregation, leaderboard recompute, notifications |
| Storage | Cloudflare R2 | No egress fees, S3-compatible |
| Image optimization | Cloudflare Images | For screenshots and example outputs |
| Email | Resend | Modern transactional email, React Email templates |
| Hosting | Vercel | Next.js ISR first-class, best DX |
| Hosting (at scale) | Railway | Migrate API layer when Vercel costs hurt |
| Product analytics | PostHog | OSS, session replay, funnels, feature flags |
| Web analytics | Plausible | Privacy-first, no cookie banner, lightweight |
| Error tracking | Sentry | Standard, Next.js one-line integration |
| Logs | Axiom | Structured logging, Vercel integration built-in |

---

## Key Decisions Explained

### Drizzle over Prisma
Prisma adds a proxy layer that introduces latency. Drizzle is closer to raw SQL, faster, and has a smaller bundle. Both are TypeScript-native but Drizzle wins on performance and simplicity for this project.

### Auth.js over Clerk
Clerk is $25+/month at scale and bundles features we don't need. Auth.js is free, OSS, and a developer audience trusts it more. Has a first-class Drizzle adapter.

### Neon over Supabase
Neon is pure serverless Postgres with DB branching (full DB clone per PR branch — huge for a small team). Supabase bundles auth, storage, and realtime which we handle separately with better tools.

### Inngest over BullMQ
BullMQ requires a persistent Redis instance to manage. Inngest is serverless, has built-in retries, fan-out, and observability, and has a great local dev experience with Next.js. Used for Reddit/HN aggregation jobs, leaderboard recomputes, and vote anomaly detection.

### Meilisearch over Algolia (at scale)
Algolia bills per search operation — expensive at scale. Meilisearch is open source, self-hostable on Railway, and has comparable features (typo tolerance, faceted filtering, instant search).

### tRPC over REST or GraphQL
No API schema to maintain. Type safety flows from the server function signature directly to the client call. When we need a public API product later, we add a separate REST layer at that point.

---

## Scaling Path

```
MVP                          → At Scale
---                            --------
Postgres tsvector            → Meilisearch (Railway)
Vercel (all-in)              → Vercel (frontend) + Railway (API/workers)
Inngest free tier            → Inngest paid or self-hosted
Upstash free tier            → Upstash pay-as-you-go
Neon free tier               → Neon paid (autoscale)
```

---

## Inngest Job Queue — Planned Jobs

| Job | Trigger | Description |
|---|---|---|
| `aggregate.reddit` | Cron (every 6h) | Crawl r/ChatGPT, r/ClaudeAI, r/LocalLLaMA for new prompts |
| `aggregate.hn` | Cron (every 12h) | Crawl HN for prompt-related posts |
| `leaderboard.recompute` | Cron (every 5m) | Recompute ranked scores, cache to Upstash |
| `votes.anomaly` | Event (on upvote) | Check vote velocity, flag suspicious patterns |
| `notify.new_prompt` | Event (on publish) | Notify followers of a creator when they post |

---

## Open Questions (Tech)

* Plasmo vs WXT for Chrome extension — Plasmo is more mature but WXT is gaining traction. Revisit before starting extension work.
* Whether to use Neon's built-in auth or stick with Auth.js + Drizzle adapter
* PostHog self-hosted vs cloud — cloud is easier, self-hosted is free but ops overhead
* Rate limiting strategy for the public aggregation API (when it ships)
