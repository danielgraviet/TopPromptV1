# Phase 01 — Monorepo Scaffold
**Status:** Not started
**Depends on:** Nothing — this is the foundation
**Blocks:** All other phases

---

## Goal

Set up the Turborepo monorepo with pnpm workspaces. Every subsequent phase builds on top of this scaffold. The agent completing this phase should produce a working repo where all apps and packages resolve, TypeScript compiles, and the dev server runs.

---

## Context

See `learnings/session-002-tech-stack.md` for full stack rationale.

Target repo structure:

```
apps/
  web/          ← Next.js 14+ (App Router)
  extension/    ← Chrome extension (Plasmo)
packages/
  db/           ← Drizzle schema + migrations
  ui/           ← shared component library (shadcn/ui)
  types/        ← shared TypeScript types
```

---

## Packages & Versions

```
turborepo (latest)
pnpm (latest)
typescript (^5)
next (^14)
react (^18)
tailwindcss (^3)
@plasmohq/sdk (latest)        ← Plasmo Chrome extension framework
drizzle-orm (latest)
drizzle-kit (latest)
shadcn/ui (via CLI)
eslint
prettier
```

---

## Tasks

### 1. Initialize Turborepo

- Run `pnpm dlx create-turbo@latest` or scaffold manually
- Configure `pnpm-workspace.yaml` to include `apps/*` and `packages/*`
- Set up root `turbo.json` with pipeline tasks: `build`, `dev`, `lint`, `typecheck`
- Set up root `package.json` with shared dev dependencies

### 2. Configure Shared TypeScript

- Create root `tsconfig.base.json` with strict mode enabled
- Each app and package extends the base config
- Ensure path aliases work across packages (e.g., `@toprompt/types`)

### 3. Scaffold `apps/web`

- Initialize Next.js 14 with App Router and TypeScript
- Install and configure Tailwind CSS
- Initialize shadcn/ui (`pnpm dlx shadcn-ui@latest init`)
- Add base shadcn/ui components: `Button`, `Input`, `Card`, `Badge`, `Avatar`, `Separator`
- Confirm `pnpm dev` starts the dev server at localhost:3000

### 4. Scaffold `apps/extension`

- Initialize Plasmo extension: `pnpm dlx plasmo init`
- Configure to use TypeScript and React
- Set up Manifest V3 with basic permissions: `activeTab`, `storage`
- Add a placeholder popup component that renders "TopPrompt" text
- Confirm `pnpm dev` loads the extension in Chrome

### 5. Scaffold `packages/types`

- Create shared TypeScript types that both `web` and `extension` will import
- Initial types to define:

```typescript
export type Prompt = {
  id: string
  title: string
  description: string
  promptText: string
  category: PromptCategory
  tags: string[]
  models: string[]
  sourceUrl?: string
  creatorId: string
  upvoteCount: number
  saveCount: number
  createdAt: Date
  updatedAt: Date
}

export type PromptCategory =
  | 'coding'
  | 'architecture'
  | 'debugging'
  | 'devops'
  | 'startup'
  | 'writing'
  | 'automation'
  | 'business'

export type User = {
  id: string
  username: string
  email: string
  avatarUrl?: string
  createdAt: Date
}
```

### 6. Scaffold `packages/db`

- Install `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
- Create placeholder `schema.ts` (full schema is Phase 02)
- Create `drizzle.config.ts` pointing to Neon connection string via env var
- Export a `db` client instance

### 7. Scaffold `packages/ui`

- Re-export shadcn/ui components from a shared package
- Both `web` and `extension` can import from `@toprompt/ui`

### 8. Configure ESLint + Prettier

- Root-level `.eslintrc.js` shared across all apps and packages
- Prettier config with consistent formatting rules
- Add lint and format scripts to root `package.json`

### 9. Environment Variables

- Create root `.env.example` with all required env vars documented:

```
# Database
DATABASE_URL=

# Auth
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Resend
RESEND_API_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

- Add `.env` to `.gitignore`

---

## Acceptance Criteria

- [ ] `pnpm dev` starts `apps/web` at localhost:3000 without errors
- [ ] `apps/extension` loads in Chrome via Plasmo dev mode
- [ ] `packages/types` exports resolve correctly in `apps/web`
- [ ] `packages/db` exports a `db` client (even if not connected yet)
- [ ] `pnpm build` completes for all apps without TypeScript errors
- [ ] `pnpm lint` passes across all packages
- [ ] `.env.example` documents all required environment variables

---

## Deliverables

- Fully scaffolded monorepo committed to `main`
- README updated with local dev setup instructions (`pnpm install`, `pnpm dev`)
