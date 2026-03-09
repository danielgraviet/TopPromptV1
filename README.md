# TopPrompt

TopPrompt is a platform for discovering and sharing high-quality AI prompts for developers, builders, and founders.

The goal is to become the default place developers go to find, rank, and reuse battle-tested prompts across web and in-workflow surfaces (browser extension, then IDE integrations).

## Product Summary

TopPrompt focuses on:

- Prompt discovery for developer workflows
- Community ranking (upvotes, saves, engagement)
- Distribution where users already work
- Creator reputation and attribution

## Core Experience

- Browse, search, save, and copy prompts
- View rich prompt pages with metadata, model compatibility, and source attribution
- Engage through upvotes and comments
- Track top prompts via leaderboards

## MVP Scope

In scope:

- User accounts (OAuth)
- Prompt submission (title, text, category, tags, model compatibility)
- Discovery (home feed, search, categories)
- Community interactions (upvotes, saves, comments)
- Prompt pages with full visible/copyable text
- Chrome extension for prompt search + copy from any tab

Out of scope (post-MVP):

- Payments/monetization
- Prompt chains
- Prompt versioning
- Remix/fork system
- IDE integrations

## Proposed Architecture

- Frontend: Next.js + Tailwind CSS
- Backend: Node.js (NestJS or Next.js API routes)
- Database: PostgreSQL
- Search: PostgreSQL full-text search initially, then Algolia/Meilisearch at scale
- Asset storage: Cloudflare R2

## Ranking Direction

Community-weighted score:

```text
Score =
(Upvotes * 0.4) +
(Saves * 0.35) +
(Comments * 0.15) +
(Recency * 0.1)
```

With time-decay recency:

```text
Recency = 1 / (hours_since_posted + 2)^1.5
```

## Repository Status

This repository is now scaffolded as a Turborepo monorepo with pnpm workspaces.

Current structure:

```text
apps/
  web/          Next.js 14 app (App Router + Tailwind)
  extension/    Plasmo Chrome extension (Manifest V3)
packages/
  types/        Shared TypeScript domain types
  db/           Drizzle config + placeholder schema/client
  ui/           Shared UI components (Button, Input, Card, Badge, Avatar, Separator)
```

## Local Development

Requirements:

- Node.js 20+
- pnpm 9+

Install:

```bash
pnpm install
```

Run all dev processes via Turbo:

```bash
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm lint
pnpm typecheck
```

Web app default URL:

- `http://localhost:3000`

Extension dev:

- Run `pnpm dev` in `apps/extension` (or root Turbo command)
- Load the generated extension build in Chrome via developer mode

## Environment Variables

Copy `.env.example` to `.env` and fill in values before working on database/auth integrations.
