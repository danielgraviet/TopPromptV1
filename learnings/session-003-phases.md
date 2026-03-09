# Session 003 — Project Phases
**Date:** March 8, 2026
**Status:** Defined — ready to execute phase by phase

---

## Phase Map

| Phase | Name | Depends On | Key Output |
|---|---|---|---|
| 01 | Monorepo Scaffold | Nothing | Turborepo + Next.js + Plasmo + shared packages running |
| 02 | Database & Auth | Phase 01 | Full Drizzle schema on Neon + Auth.js GitHub/Google OAuth |
| 03 | Core Web App | Phase 01, 02 | Homepage, prompt pages, submission, search, creator profiles |
| 04 | Community Features | Phase 03 | Upvotes, saves, comments, follows, leaderboards, rate limiting |
| 05 | Chrome Extension | Phase 03 | Plasmo extension with prompt insert into Claude.ai / ChatGPT |
| 06 | Background Jobs | Phase 03, 04 | Inngest jobs: Reddit/HN aggregation, leaderboard recompute, notifications |
| 07 | SEO & Performance | Phase 03 | ISR, metadata, OG images, sitemap, Lighthouse ≥ 90 |
| 08 | Observability & Launch | Phase 03–07 | Sentry, PostHog, admin panel, 100+ seeded prompts, live launch |

Phases 05, 06, and 07 can run in parallel after Phase 03 is complete.

---

## Critical Path

```
Phase 01 → Phase 02 → Phase 03 → Phase 04 → Phase 08
                              ↘ Phase 05 ↗
                              ↘ Phase 06 ↗
                              ↘ Phase 07 ↗
```

---

## Task File Locations

All phase files live in `tasks/`:

```
tasks/phase-01-monorepo-scaffold.md
tasks/phase-02-database-and-auth.md
tasks/phase-03-core-web-app.md
tasks/phase-04-community-features.md
tasks/phase-05-chrome-extension.md
tasks/phase-06-background-jobs-and-aggregation.md
tasks/phase-07-seo-and-performance.md
tasks/phase-08-observability-and-launch.md
```

---

## Instructions for AI Agents

Each task file contains:
- Status (Not started / In progress / Complete)
- Dependencies (what must be done first)
- Full context references (which learnings files to read)
- Package list with exact names
- Step-by-step implementation tasks
- Acceptance criteria (what done looks like)
- Deliverables

Before starting any phase:
1. Read `learnings/session-001-product-direction.md`
2. Read `learnings/session-002-tech-stack.md`
3. Read the specific phase file
4. Check that all dependency phases are marked Complete

Update the phase file's Status field as you work.
