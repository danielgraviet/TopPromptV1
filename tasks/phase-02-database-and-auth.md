# Phase 02 — Database Schema & Auth
**Status:** Complete
**Depends on:** Phase 01 (monorepo scaffold)
**Blocks:** Phase 03, all feature phases

---

## Goal

Define the complete Drizzle schema in `packages/db`, run the initial migration against Neon, and wire up Auth.js v5 with GitHub and Google OAuth. At the end of this phase, a user can sign up and log in, and the database has all tables needed for the MVP.

---

## Context

See `learnings/session-002-tech-stack.md` for stack rationale.
See `overview.md` section 9 for the full table list.

- ORM: Drizzle
- Database: PostgreSQL on Neon (serverless)
- Auth: Auth.js v5 with Drizzle adapter
- OAuth providers: GitHub (primary), Google (secondary)

---

## Packages

```
drizzle-orm
drizzle-kit
@neondatabase/serverless
next-auth@beta          ← Auth.js v5
@auth/drizzle-adapter
postgres
dotenv
```

---

## Tasks

### 1. Neon Setup

- Create a Neon project at neon.tech
- Create two branches: `main` (production) and `dev` (development)
- Copy the connection strings into `.env` as `DATABASE_URL`
- Confirm connection works with a simple query

### 2. Complete Drizzle Schema (`packages/db/schema.ts`)

Define all tables using Drizzle's PostgreSQL dialect:

**users**
```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**accounts** (Auth.js required)
```typescript
export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }))
```

**sessions** (Auth.js required)
```typescript
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})
```

**prompts**
```typescript
export const prompts = pgTable('prompts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  promptText: text('prompt_text').notNull(),
  creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  sourceUrl: text('source_url'),
  searchVector: tsvector('search_vector'),   // full-text search
  upvoteCount: integer('upvote_count').default(0).notNull(),
  saveCount: integer('save_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  score: real('score').default(0).notNull(),  // precomputed ranking score
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**prompt_tags**
```typescript
export const promptTags = pgTable('prompt_tags', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
}, (t) => ({ uniq: unique().on(t.promptId, t.tag) }))
```

**prompt_models**
```typescript
export const promptModels = pgTable('prompt_models', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  modelName: text('model_name').notNull(),   // e.g. "claude-3-7", "gpt-4o"
  lastVerifiedAt: timestamp('last_verified_at'),
}, (t) => ({ uniq: unique().on(t.promptId, t.modelName) }))
```

**upvotes**
```typescript
export const upvotes = pgTable('upvotes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ uniq: unique().on(t.userId, t.promptId) }))
```

**saves**
```typescript
export const saves = pgTable('saves', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ uniq: unique().on(t.userId, t.promptId) }))
```

**comments**
```typescript
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**follows**
```typescript
export const follows = pgTable('follows', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.followerId, t.followingId] }) }))
```

### 3. Database Indexes

Add these indexes for query performance:

```typescript
// Full-text search GIN index on prompts
pgTable('prompts', { ... }, (t) => ({
  searchIdx: index('prompts_search_idx').using('gin', t.searchVector),
  categoryIdx: index('prompts_category_idx').on(t.category),
  scoreIdx: index('prompts_score_idx').on(t.score),
  creatorIdx: index('prompts_creator_idx').on(t.creatorId),
}))
```

### 4. Search Vector Trigger

Create a Postgres trigger to automatically update `search_vector` on insert/update:

```sql
CREATE OR REPLACE FUNCTION prompts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.prompt_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompts_search_vector_trigger
BEFORE INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION prompts_search_vector_update();
```

Run this as a raw SQL migration.

### 5. Run Initial Migration

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Confirm all tables exist in the Neon console.

### 6. Configure Auth.js v5

- Create `apps/web/auth.ts` with GitHub and Google providers
- Wire up the Drizzle adapter pointing to `packages/db`
- Add Auth.js API route at `apps/web/app/api/auth/[...nextauth]/route.ts`
- Add `SessionProvider` to root layout

```typescript
// apps/web/auth.ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@toprompt/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [GitHub, Google],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
})
```

### 7. OAuth App Setup (GitHub & Google)

Document steps to create OAuth apps:

**GitHub:**
- Settings → Developer settings → OAuth Apps → New OAuth App
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

**Google:**
- Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

Add production URLs when deploying to Vercel.

### 8. Auth UI

- Create `/app/login/page.tsx` with sign-in buttons for GitHub and Google
- Add a session-aware navbar (shows user avatar + username when signed in)
- Protected route middleware: redirect unauthenticated users away from `/submit`

---

## Acceptance Criteria

- [ ] All tables exist in Neon and match the schema above
- [ ] GIN index on `search_vector` is confirmed in Neon console
- [ ] Search vector trigger fires on insert (test with a manual SQL insert)
- [ ] GitHub OAuth sign-in works end-to-end at localhost:3000
- [ ] Google OAuth sign-in works end-to-end at localhost:3000
- [ ] Session persists across page refreshes
- [ ] `auth()` helper returns the current user in server components
- [ ] Unauthenticated users are redirected from protected routes

---

## Deliverables

- Complete Drizzle schema in `packages/db/schema.ts`
- Initial migration applied to Neon dev branch
- Auth.js configured with GitHub + Google providers
- Login page and session-aware navbar
