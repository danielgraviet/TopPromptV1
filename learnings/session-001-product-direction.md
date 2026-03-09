# Session 001 — Product Direction & Strategy
**Date:** March 8, 2026
**Status:** Foundational decisions locked

---

## What TopPrompt Is

A community-driven prompt library for developers, builders, and founders. Think GitHub for prompts — not a marketplace, not a tool, a discovery and reputation platform.

**Tagline:** The default place developers go to find and share AI prompts.

---

## What TopPrompt Is NOT

* Not PromptBase — that site is full of low-quality image gen slop aimed at casual users
* Not an image generation platform — explicitly excluded (Midjourney, Stable Diffusion, etc.)
* Not a prompt execution / testing tool — users test on their own accounts
* Not a marketplace at launch — monetization is post-traction, MVP is free

---

## Core Product Decisions

### Audience
Developers, indie hackers, startup founders, DevOps engineers, technical writers. Not casual consumers.

### Prompt Access
Prompts are always fully visible and copyable — no paywalls, no preview gates. Distribution and ease of access is the primary value. If people copy and share prompts, that is fine — more users is the goal.

### Quality Signal
Community-driven only (upvotes, saves, comments). No verification, no editorial review. Honest signal like GitHub stars — people upvote what they find useful, not what they have audited.

### Monetization
Deferred. Build users and content density first. Post-traction options: creator subscriptions, prompt packs, API access, enterprise private libraries.

---

## The Moat Strategy

Distribution is the only real moat. Whoever controls where devs habitually go to grab prompts wins.

Priority order:
1. **Chrome extension** — insert prompts directly into Claude.ai / ChatGPT from a sidebar. Habit-forming, embedded in existing workflow.
2. **Aggregation** — crawl Reddit, HN, Twitter, Discord. Be the canonical searchable index for scattered community prompt knowledge.
3. **Prompt Chains** — workflow sequences (multi-step prompts) are harder to commoditize than single prompts.
4. **Model version tagging** — track which prompts survive AI model updates. Unique ongoing value no AI company will build for themselves.
5. **Creator reputation** — following a trusted prompt engineer is social behavior, not just content access.
6. **IDE integrations** (post-MVP) — VS Code, Cursor, Zed.

---

## MVP Scope (What to Build First)

- User accounts (GitHub + Google OAuth)
- Prompt submission (title, text, category, tags, model compatibility, source attribution)
- Homepage feed (trending + recent)
- Search (Postgres full-text search — no Algolia yet)
- Category browsing
- Upvotes, saves, comments
- Prompt pages (full text always visible, copy button)
- Creator profiles
- Chrome extension (search + one-click insert)

**Excluded from MVP:** payments, prompt chains, versioning, fork/remix, IDE integrations

---

## Categories (Dev-Focused Only)

* Coding
* Architecture & System Design
* Debugging
* DevOps & Infrastructure
* Startup & Product
* Writing for Devs (docs, READMEs, specs)
* Automation & Scripting
* Business & GTM

---

## Tech Stack Decisions

* **Frontend:** Next.js + Tailwind CSS
* **Backend:** Next.js API routes or NestJS
* **Database:** PostgreSQL
* **Search:** Postgres `tsvector` for MVP, migrate to Algolia/Meilisearch at scale
* **Storage:** Cloudflare R2
* **Auth:** OAuth (GitHub primary, Google secondary)

---

## Ranking Algorithm

```
Score =
(Upvotes * 0.4) +
(Saves * 0.35) +
(Comments * 0.15) +
(Recency * 0.1)

Recency = 1 / (hours_since_posted + 2)^1.5
```

HN-style time decay — fresh prompts stay competitive, old prompts don't dominate forever.

---

## Key Risks to Watch

1. **Prompt commoditization** — AI models getting better at generating prompts natively. Counter with distribution moat and chains.
2. **Low quality submissions** — mitigated by voting + moderation, not editorial gatekeeping.
3. **Vote manipulation** — rate limiting, account age requirements, velocity anomaly detection.

---

## Open Questions (Not Yet Decided)

* How to seed initial content — manual curation, aggregation bots, or invite-only early creators?
* Chrome extension UX — sidebar overlay or popup?
* Whether prompt chains need their own submission flow or reuse the single-prompt form
* What "source attribution" looks like UX-wise on a prompt page
