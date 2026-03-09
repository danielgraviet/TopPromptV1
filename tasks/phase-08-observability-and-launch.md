# Phase 08 — Observability, Moderation & Launch
**Status:** Not started
**Depends on:** Phase 03–07 (all prior phases)
**Blocks:** Nothing — this is the final phase before public launch

---

## Goal

Wire up all observability tooling (Sentry, PostHog, Plausible, Axiom), build basic admin/moderation tooling, configure production environment, and execute the launch checklist. At the end of this phase, the platform is live, monitored, and ready for real users.

---

## Context

See `learnings/session-002-tech-stack.md` for tool choices:
- Error tracking: Sentry
- Product analytics: PostHog
- Web analytics: Plausible
- Logs: Axiom
- Email: Resend

---

## Packages

```
@sentry/nextjs
posthog-js
posthog-node
```

---

## Tasks

### 1. Sentry — Error Tracking

Install and configure Sentry for Next.js.

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

This auto-generates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`

Configuration:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,        // 10% of transactions
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0, // always replay on error
  environment: process.env.NODE_ENV,
})
```

**What to capture:**
- All unhandled errors (automatic)
- tRPC procedure errors (wrap with Sentry in tRPC error handler)
- Inngest job failures (Inngest retries automatically, log to Sentry on final failure)

**Alerts to configure in Sentry dashboard:**
- Any new error → Slack/email alert
- Error rate spike (> 10 errors/min) → immediate alert

### 2. PostHog — Product Analytics

**Server-side tracking (tRPC):**
```typescript
// In tRPC context or middleware
import { PostHog } from 'posthog-node'
const posthog = new PostHog(process.env.POSTHOG_API_KEY!)

// Track key events:
posthog.capture({ distinctId: userId, event: 'prompt_viewed', properties: { promptId, category } })
posthog.capture({ distinctId: userId, event: 'prompt_copied', properties: { promptId } })
posthog.capture({ distinctId: userId, event: 'prompt_upvoted', properties: { promptId } })
posthog.capture({ distinctId: userId, event: 'prompt_submitted', properties: { category } })
posthog.capture({ distinctId: userId, event: 'user_signed_up', properties: { provider } })
```

**Client-side tracking:**
```typescript
// apps/web/app/providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false, // manual pageview capture with Next.js router
})
```

**Key funnels to set up in PostHog:**
1. Landing → Search → Prompt view → Copy (main activation funnel)
2. Landing → Sign up → Submit prompt (creator funnel)
3. Extension install → First insert (extension activation funnel)

**Feature flags (post-launch):**
- Use PostHog feature flags for rolling out prompt chains, versioning, etc.

### 3. Plausible — Web Analytics

Simple, privacy-first page view tracking. No cookie banner required.

```typescript
// Add to apps/web/app/layout.tsx
<Script
  defer
  data-domain="topprompt.dev"
  src="https://plausible.io/js/script.js"
/>
```

Set up in Plausible dashboard:
- Goal: "Copy Prompt" (custom event)
- Goal: "Sign Up"
- Goal: "Submit Prompt"

### 4. Axiom — Structured Logging

Axiom integrates directly with Vercel — logs are automatically shipped.

Connect the Vercel project to Axiom via the Vercel integration in the Axiom dashboard.

Add structured logging in key places:
```typescript
import { Logger } from 'next-axiom'
const log = new Logger()

// In aggregation jobs:
log.info('reddit.aggregated', { subreddit, postsFound, postsInserted })

// In tRPC error handler:
log.error('trpc.error', { procedure, error: err.message, userId })
```

Set up Axiom dashboards for:
- Aggregation job success/failure rates
- tRPC error rates by procedure
- Search query volume

### 5. Basic Admin Panel (`/admin`)

Simple, protected admin route for moderation. Not a full CMS — just the essentials.

**Access control:** Hardcode allowed admin emails in an env var `ADMIN_EMAILS=you@example.com`.

**Admin pages:**

`/admin` — Dashboard
```
[Total prompts] [Total users] [Prompts today] [Flagged prompts]
```

`/admin/flagged` — Flagged Prompts
```
List of prompts where flagged = true
[Unflag] [Delete] buttons per row
```

`/admin/prompts` — All Prompts
```
Searchable table of all prompts
[Delete] button per row
```

`/admin/aggregated` — Review aggregated content
```
List of prompts where creator_id = SYSTEM_USER_ID (bot-aggregated)
[Approve] [Delete] per row
Approved prompts get a verified_at timestamp
```

Implement using basic Next.js server components with direct DB queries — no tRPC needed for admin.

### 6. Resend — Transactional Emails

Set up email templates with React Email:

**Templates to create:**

`WelcomeEmail` — sent on first sign-up
```
Subject: Welcome to TopPrompt
Body: Brief intro, link to submit first prompt
```

`NewFollowerEmail` — sent when someone follows you
```
Subject: {username} is now following you on TopPrompt
```

`WeeklyDigestEmail` — top prompts of the week (post-MVP)

Set up Resend domain at `hello@topprompt.dev` with DNS records on Cloudflare.

### 7. Production Environment Setup

**Vercel:**
- Connect GitHub repo to Vercel
- Set all environment variables from `.env.example`
- Set up preview deployments on PR branches (using Neon DB branching)
- Configure custom domain `topprompt.dev`

**Neon:**
- Promote `dev` branch to `main` after final migration
- Enable autoscaling on the production branch

**Upstash:**
- Create production Redis database
- Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel

**Inngest:**
- Register production webhook: `https://topprompt.dev/api/inngest`
- Verify all cron jobs are scheduled

**Cloudflare:**
- DNS records pointing to Vercel
- R2 bucket created for production
- Cloudflare Images enabled

### 8. Pre-Launch Content Seeding

Before opening to the public, seed the platform with enough content to not look empty.

**Target:** 100+ high-quality prompts across all categories.

Sources:
1. Run the Reddit aggregation job manually for the first seed
2. Run the HN aggregation job manually
3. Manually curate and submit 20–30 top prompts by hand (best ones from your own research)
4. Invite 5–10 developer friends to submit prompts before launch

All seeded prompts should have accurate categories and model tags.

### 9. Launch Checklist

**Technical:**
- [ ] `pnpm build` passes with no TypeScript errors
- [ ] Lighthouse ≥ 90 on Performance, SEO, Accessibility
- [ ] Sentry is capturing errors in production
- [ ] PostHog is tracking events in production
- [ ] Inngest cron jobs are firing in production
- [ ] Sitemap is live at `https://topprompt.dev/sitemap.xml`
- [ ] OG images render correctly (test with opengraph.xyz)
- [ ] Copy-to-clipboard works on all major browsers (Chrome, Firefox, Safari)
- [ ] Auth flow works end-to-end in production (GitHub + Google)
- [ ] Rate limiting is active on upvotes and comments
- [ ] Admin panel is accessible and flagging works

**Content:**
- [ ] 100+ prompts seeded across all categories
- [ ] Each category has at least 10 prompts
- [ ] All seeded prompts have titles, descriptions, and model tags
- [ ] No obviously broken or empty prompt pages

**Legal:**
- [ ] Privacy Policy page (`/privacy`)
- [ ] Terms of Service page (`/terms`)
- [ ] Source attribution visible on aggregated prompts

**Launch:**
- [ ] Post on r/SideProject
- [ ] Post on r/ChatGPT with a curated "best prompts" thread
- [ ] Post on Hacker News (Show HN)
- [ ] Share on Twitter/X with a demo GIF of the Chrome extension inserting a prompt
- [ ] Submit to ProductHunt

---

## Acceptance Criteria

- [ ] Sentry dashboard shows < 0 unhandled errors on day 1
- [ ] PostHog funnel shows copy events firing on prompt pages
- [ ] Admin can unflag and delete prompts via `/admin`
- [ ] Welcome email sends on sign-up
- [ ] Production Vercel deployment is live at `topprompt.dev`
- [ ] All launch checklist items checked

---

## Deliverables

- Sentry, PostHog, Plausible, Axiom all wired up in production
- Admin panel at `/admin` with flagged prompt review
- React Email templates: Welcome, NewFollower
- Production environment fully configured
- 100+ seeded prompts
- Platform live at `topprompt.dev`
