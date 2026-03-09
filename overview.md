# TopPrompt — Technical Product Document

## 1. Overview

**TopPrompt** is a platform for discovering and sharing high-quality AI prompts for developers, builders, and founders — the GitHub for prompts.

The platform provides:

* A **community-driven prompt library** focused on dev and builder workflows
* A **ranking system based on community signal** (upvotes, saves, usage)
* **Easy access to prompts** — browser extension, IDE integrations, and web
* A **creator reputation system** for prompt engineers and developers

TopPrompt aims to become the **default place developers go to find and share AI prompts**.

---

# 2. Product Goals

### Primary Goals

1. **Prompt Discovery**

   * Help developers instantly find high-quality, battle-tested prompts.

2. **Community Ranking**

   * Surface the most useful prompts through upvotes and engagement — no verification theater, just honest signal like GitHub stars.

3. **Distribution**

   * Meet developers where they work: browser, editor, terminal.

4. **Creator Reputation**

   * Give prompt engineers a public portfolio and following.

---

# 3. Target Users

### Prompt Consumers

Developers, builders, and founders who want better results from AI tools.

Examples:

* software engineers
* startup founders
* product managers
* indie hackers
* DevOps / platform engineers
* technical writers

---

### Prompt Creators

Developers who have figured out high-signal prompts and want to share them.

Examples:

* senior engineers
* AI-native builders
* prompt engineers
* developer educators

---

# 4. Core Features

## 4.1 Prompt Library

Users can browse, search, save, and copy prompts.

### Prompt Listing Includes

* Title
* Description
* Prompt text (full, no paywall)
* Category
* Tags
* Compatible AI models
* Upvote count
* Save count
* Creator profile
* Source attribution (original Reddit/HN/Discord link if applicable)

---

## 4.2 Prompt Chains

Users can publish sequences of prompts as a workflow, not just single prompts.

Example chain:

```
Step 1: "Generate a technical spec from this feature idea"
Step 2: "Break the spec into engineering tickets"
Step 3: "Estimate effort for each ticket"
```

Chains are first-class content — browseable and upvotable alongside single prompts.

---

## 4.3 Leaderboards

Prompts ranked based on community signal.

Leaderboards include:

* Top prompts today
* Top prompts this week
* Most saved prompts
* Top by category
* Top by AI model

Example leaderboard entry:

```
Rank: #1
Prompt: "Senior Engineer Code Review"
Upvotes: 4,200
Saves: 1,800
Category: Coding
Works with: Claude 3.7, GPT-4o
```

---

## 4.4 Categories

Prompts organized for developer workflows:

* Coding
* Architecture & System Design
* Debugging
* DevOps & Infrastructure
* Startup & Product
* Writing for Devs (docs, READMEs, specs)
* Automation & Scripting
* Business & GTM

---

## 4.5 Prompt Pages

Each prompt has a dedicated page.

### Prompt Page Components

**Metadata**

* title
* creator
* category
* tags
* compatible models (e.g., Claude 3.7, GPT-4o, o3)
* model version notes (e.g., "updated for Claude 3.7")
* upvotes / saves
* source attribution link

**Prompt Content**

* full prompt text — always visible, always copyable
* usage instructions
* variable placeholders (e.g., `{{language}}`, `{{framework}}`)

**Community**

* upvotes
* comments
* forks/remixes
* linked chains that use this prompt

---

## 4.6 Model Compatibility Tagging

Prompts are tagged by which AI models they work well with, and whether they have survived model updates.

Examples:

```
Works with: Claude 3.7, GPT-4o, o3
Last verified: March 2026
```

This provides signal that AI companies themselves will not build.

---

## 4.7 Prompt Versioning

Creators can update prompts as AI models evolve.

Example:

```
v1 - Original prompt (GPT-4)
v2 - Adjusted for Claude 3.5
v3 - Updated for o3 / Claude 3.7
```

Users can see version history.

---

## 4.8 Prompt Remix / Forking

Users can fork and improve prompts.

Forked prompts reference the original creator.

```
Original Prompt (creator A)
    ↓
Fork — improved structure (creator B)
    ↓
Fork — added edge case handling (creator C)
```

This creates a prompt evolution graph.

---

# 5. Access & Distribution

Distribution is the moat. TopPrompt meets developers where they already work.

## 5.1 Web App

Primary interface for discovery, browsing, and publishing.

## 5.2 Chrome Extension

Users can access and insert prompts without leaving their current tab.

Workflow:

1. User is on Claude.ai, ChatGPT, or any AI tool
2. Opens extension sidebar
3. Searches for a prompt
4. One-click insert into active input field

This is the core distribution mechanism — habit-forming and hard to replicate once embedded in workflow.

## 5.3 IDE Integration (Post-MVP)

VS Code and Cursor extensions for in-editor prompt access.

* Search prompts from command palette
* Insert directly into chat (Cursor, Copilot, etc.)
* Save prompts from within editor

---

# 6. Monetization

**MVP is free.** Build users and content density first. Monetization comes after traction.

### Post-MVP Options

* **Creator subscriptions** — follow a creator, get notified of new prompts
* **Prompt Packs** — curated bundles sold by top creators
* **API access** — programmatic access to the prompt library for teams and tools
* **Enterprise** — private prompt libraries for engineering orgs

---

# 7. Growth Strategy

## 7.1 SEO

Each prompt page is an SEO landing page targeting high-intent queries:

* "best Claude prompt for code review"
* "ChatGPT prompt for system design"
* "prompt for writing a PRD"
* "debugging prompt for GPT-4"

## 7.2 Aggregation

Source prompts from existing communities with attribution:

* Reddit (r/ChatGPT, r/ClaudeAI, r/LocalLLaMA)
* Hacker News threads
* Twitter/X
* Discord servers

TopPrompt becomes the canonical, searchable index for scattered community knowledge.

## 7.3 Creator Economy

Top contributors build public reputations and followings.

Creator profiles include:

* prompt catalog
* total upvotes
* followers
* top prompts

## 7.4 Social Sharing

Prompt pages are shareable. Shared outputs link back to the platform.

---

# 8. MVP Scope

Focus: get prompts in front of developers as fast as possible.

### MVP Features

**User Accounts**

* signup / login (OAuth — GitHub, Google)
* creator profiles

**Prompt Submission**

* title
* prompt text
* category
* tags
* compatible model(s)
* source attribution (optional)

**Discovery**

* homepage feed (trending + recent)
* search
* category browsing

**Community**

* upvotes
* saves
* comments

**Prompt Pages**

* full prompt text, always visible
* copy-to-clipboard button
* creator profile link

**Chrome Extension (MVP)**

* search and copy prompts from any tab

---

### Excluded from MVP

* payments / monetization
* prompt chains
* versioning
* remix / fork system
* IDE integrations

These are added post-traction.

---

# 9. System Architecture

## Repo Structure

Turborepo monorepo with pnpm workspaces.

```
apps/
  web/          ← Next.js app
  extension/    ← Chrome extension (Plasmo)
packages/
  db/           ← Drizzle schema + migrations (shared)
  ui/           ← shared component library
  types/        ← shared TypeScript types
```

---

## Frontend

Stack:

* Next.js 14+ (App Router)
* Tailwind CSS
* shadcn/ui
* TypeScript

Responsibilities:

* SSR / ISR for SEO-optimized prompt pages
* prompt browsing, search, and submission
* user profiles and leaderboards

---

## Chrome Extension

Framework: **Plasmo** (React + TypeScript, Manifest V3)

Shares types and API client with the web app via the monorepo.

---

## Backend

Stack:

* Next.js Route Handlers + **tRPC**

tRPC provides end-to-end type safety between server and client with no API schema to maintain. A public REST API layer is added post-MVP when the prompt API product ships.

---

## Auth

**Auth.js v5** — GitHub OAuth (primary), Google OAuth (secondary).

Free, open source, first-class Drizzle adapter. No third-party auth vendor costs.

---

## Database

**PostgreSQL on Neon** (serverless, DB branching per PR environment)

ORM: **Drizzle** (lighter than Prisma, TypeScript-native, SQL-close syntax)

Core tables:

**Users**

```
id
username
email
password_hash
avatar_url
created_at
```

**Prompts**

```
id
title
description
prompt_text
creator_id
category
source_url
created_at
updated_at
```

**PromptTags**

```
id
prompt_id
tag
```

**PromptModels**

```
id
prompt_id
model_name        -- e.g. "claude-3-7", "gpt-4o"
last_verified_at
```

**Upvotes**

```
id
user_id
prompt_id
created_at
```

**Saves**

```
id
user_id
prompt_id
created_at
```

**Comments**

```
id
user_id
prompt_id
body
created_at
```

---

## Search

**MVP:** PostgreSQL full-text search (`tsvector` + GIN index) across title, description, tags, prompt_text.

**At scale:** Meilisearch (open source, self-hostable on Railway — cheaper than Algolia at volume).

---

## Caching & Rate Limiting

**Upstash Redis** — serverless, pay per request.

Used for:
* Leaderboard cache (recomputed every 5 min via background job)
* Upvote / save rate limiting per user
* Session caching

---

## Background Jobs

**Inngest** — serverless job queue, first-class Next.js support.

Planned jobs:

| Job | Trigger | Purpose |
|---|---|---|
| `aggregate.reddit` | Cron (every 6h) | Crawl r/ChatGPT, r/ClaudeAI, r/LocalLLaMA |
| `aggregate.hn` | Cron (every 12h) | Crawl HN for prompt posts |
| `leaderboard.recompute` | Cron (every 5m) | Recompute scores, write to cache |
| `votes.anomaly` | Event (on upvote) | Flag suspicious vote velocity |
| `notify.new_prompt` | Event (on publish) | Notify creator followers |

---

## Storage

Cloudflare R2 (no egress fees, S3-compatible) + Cloudflare Images for screenshots.

---

## Email

**Resend** — transactional email with React Email templates.

---

## Hosting

**Vercel** for the web app (Next.js ISR first-class).

Migration path: move API layer to **Railway** when Vercel costs become significant.

---

## Observability

* **PostHog** — product analytics, session replay, feature flags
* **Plausible** — lightweight web analytics, no cookie banner
* **Sentry** — error tracking
* **Axiom** — structured logs

---

# 10. Ranking Algorithm

Prompts ranked by weighted community score:

```
Score =
(Upvotes * 0.4) +
(Saves * 0.35) +
(Comments * 0.15) +
(Recency * 0.1)
```

Recency uses time-decay (similar to Hacker News):

```
Recency = 1 / (hours_since_posted + 2)^1.5
```

This keeps fresh prompts competitive without letting old prompts dominate forever.

---

# 11. Key Metrics

### Platform Metrics

* total prompts
* weekly active users
* prompts copied / saved per session
* extension installs

### Creator Metrics

* prompts per creator
* creator follower growth
* top creator upvote counts

### Engagement Metrics

* upvotes
* saves
* comments
* prompt page views

---

# 12. Risks

### Low Prompt Quality

Many submissions may be low quality.

Mitigation:

* community voting surfaces quality naturally
* moderation tools for flagging
* leaderboards push quality to the top

### Prompt Commoditization

AI models are improving at generating prompts natively. The window for static prompt value is shrinking.

Mitigation:

* **Distribution moat** — Chrome extension and IDE integrations make TopPrompt the default access point, regardless of where the prompt originated
* **Community signal** — aggregated upvotes and saves provide trust signal that AI cannot self-generate
* **Prompt chains** — workflow sequences are harder to commoditize than single prompts
* **Model versioning** — tracking which prompts survive model updates is unique, ongoing value
* **Creator reputation** — following a trusted prompt engineer is a social behavior, not just content consumption

### Fraud / Vote Manipulation

Bots inflating upvotes to game leaderboards.

Mitigation:

* rate limiting on upvotes per account
* account age requirements for voting
* anomaly detection on vote velocity

---

# 13. Long-Term Vision

TopPrompt becomes the **standard platform for developer AI workflows**.

Evolution path:

```
Prompt library → Prompt chains → AI workflow marketplace
```

Future possibilities:

* prompt APIs for teams and products
* AI agent templates and system prompts
* enterprise private prompt libraries
* workflow automation sequences
* prompt analytics (model performance tracking over time)
* native integrations with Cursor, Zed, VS Code

The platform evolves from **prompt discovery → developer AI infrastructure**.
