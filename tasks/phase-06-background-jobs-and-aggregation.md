# Phase 06 — Background Jobs & Aggregation
**Status:** Not started
**Depends on:** Phase 03 (core web app), Phase 04 (community features — scores must exist)
**Blocks:** Nothing (additive layer)

---

## Goal

Implement the Inngest background job queue for all async work: leaderboard recomputation, Reddit/HN content aggregation, creator follower notifications, and vote anomaly detection. The aggregation pipeline is a core part of the growth strategy — it seeds the platform with real content and drives SEO.

---

## Context

See `learnings/session-001-product-direction.md`:
> Aggregation — crawl Reddit, HN, Twitter, Discord. Be the canonical searchable index for scattered community prompt knowledge.

See `learnings/session-002-tech-stack.md`:
> Inngest — serverless job queue, first-class Next.js support. Used for aggregation, leaderboard recompute, vote anomaly detection.

---

## Packages

```
inngest
@inngest/next          ← Next.js adapter
cheerio                ← HTML parsing for HN
zod
```

---

## Tasks

### 1. Inngest Setup

- Create `apps/web/inngest/client.ts` — Inngest client instance
- Create `apps/web/app/api/inngest/route.ts` — Inngest HTTP handler

```typescript
// inngest/client.ts
import { Inngest } from 'inngest'
export const inngest = new Inngest({ id: 'topprompt' })
```

```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next'
import { inngest } from '../../../inngest/client'
import { functions } from '../../../inngest/functions'

export const { GET, POST, PUT } = serve({ client: inngest, functions })
```

Register the Inngest webhook endpoint in the Inngest dashboard pointing to `https://topprompt.dev/api/inngest`.

### 2. Leaderboard Recompute Job

**Trigger:** Cron, every 5 minutes

Recomputes the ranking score for all prompts created in the last 30 days and caches the top 50 in Upstash.

```typescript
export const recomputeLeaderboard = inngest.createFunction(
  { id: 'leaderboard.recompute' },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const cutoff = subDays(new Date(), 30)

    const recentPrompts = await step.run('fetch-recent-prompts', async () => {
      return db.select().from(prompts).where(gte(prompts.createdAt, cutoff))
    })

    await step.run('update-scores', async () => {
      for (const prompt of recentPrompts) {
        const hoursOld = (Date.now() - prompt.createdAt.getTime()) / 3600000
        const recency = 1 / Math.pow(hoursOld + 2, 1.5)
        const score =
          (prompt.upvoteCount * 0.4) +
          (prompt.saveCount * 0.35) +
          (prompt.commentCount * 0.15) +
          (recency * 0.1)

        await db.update(prompts)
          .set({ score, updatedAt: new Date() })
          .where(eq(prompts.id, prompt.id))
      }
    })

    await step.run('cache-leaderboard', async () => {
      const top50 = await db.select().from(prompts)
        .orderBy(desc(prompts.score))
        .limit(50)
      await redis.set('leaderboard:weekly', top50, { ex: 300 })
    })
  }
)
```

### 3. Reddit Aggregation Job

**Trigger:** Cron, every 6 hours

Crawls Reddit JSON APIs for prompt-related posts. Reddit has a public JSON API — no auth needed for public subreddits.

**Target subreddits:**
- `r/ChatGPT` — search for "prompt" in post title
- `r/ClaudeAI` — all posts
- `r/LocalLLaMA` — search for "system prompt" or "prompt"
- `r/PromptEngineering` — all posts
- `r/artificial` — search for "prompt"

```typescript
export const aggregateReddit = inngest.createFunction(
  { id: 'aggregate.reddit' },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    const subreddits = [
      { name: 'ChatGPT', query: 'prompt' },
      { name: 'ClaudeAI', query: null },
      { name: 'LocalLLaMA', query: 'prompt' },
      { name: 'PromptEngineering', query: null },
    ]

    for (const sub of subreddits) {
      await step.run(`crawl-${sub.name}`, async () => {
        const url = sub.query
          ? `https://www.reddit.com/r/${sub.name}/search.json?q=${sub.query}&restrict_sr=1&sort=new&limit=25`
          : `https://www.reddit.com/r/${sub.name}/new.json?limit=25`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'TopPrompt/1.0 (aggregator bot)' }
        })
        const data = await res.json()
        const posts = data.data.children.map((c: any) => c.data)

        for (const post of posts) {
          // Skip if already in DB (check by sourceUrl)
          const existing = await db.select()
            .from(prompts)
            .where(eq(prompts.sourceUrl, post.url))
            .limit(1)

          if (existing.length > 0) continue

          // Basic quality filter: min score 10, not deleted
          if (post.score < 10 || post.selftext === '[deleted]') continue

          // Extract prompt text from post body
          const promptText = extractPromptFromPost(post.selftext)
          if (!promptText) continue

          await db.insert(prompts).values({
            id: nanoid(),
            title: post.title.slice(0, 200),
            description: post.selftext.slice(0, 500),
            promptText,
            creatorId: SYSTEM_USER_ID,    // attributed to TopPrompt bot user
            category: inferCategory(post.title, post.selftext),
            sourceUrl: `https://reddit.com${post.permalink}`,
            upvoteCount: 0,
            saveCount: 0,
            commentCount: 0,
            score: 0,
          })
        }
      })
    }
  }
)
```

**Helper functions needed:**
- `extractPromptFromPost(text)` — heuristic to pull the actual prompt text from a Reddit post body. Look for code blocks, quoted sections, or lines starting with "Prompt:".
- `inferCategory(title, body)` — keyword-based category inference. E.g., title contains "debug" → "debugging", "deploy" → "devops", etc.

### 4. Hacker News Aggregation Job

**Trigger:** Cron, every 12 hours

Uses the HN Algolia API to search for relevant posts.

```typescript
export const aggregateHN = inngest.createFunction(
  { id: 'aggregate.hn' },
  { cron: '0 */12 * * *' },
  async ({ step }) => {
    const queries = ['prompt engineering', 'system prompt', 'LLM prompt', 'Claude prompt']

    for (const query of queries) {
      await step.run(`crawl-hn-${query}`, async () => {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`
        const res = await fetch(url)
        const data = await res.json()

        for (const hit of data.hits) {
          if (hit.points < 10) continue

          const existing = await db.select()
            .from(prompts)
            .where(eq(prompts.sourceUrl, hit.url ?? hit.story_url))
            .limit(1)

          if (existing.length > 0) continue

          // HN stories often link externally — fetch and extract prompt from content
          // For simplicity in MVP, use the story title and any comment text
          await db.insert(prompts).values({
            id: nanoid(),
            title: hit.title.slice(0, 200),
            description: `From Hacker News — ${hit.points} points`,
            promptText: hit.story_text ?? hit.title,
            creatorId: SYSTEM_USER_ID,
            category: inferCategory(hit.title, hit.story_text ?? ''),
            sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            score: 0,
            upvoteCount: 0,
            saveCount: 0,
            commentCount: 0,
          })
        }
      })
    }
  }
)
```

### 5. Vote Anomaly Detection Job

**Trigger:** Event — fires on every upvote

Checks velocity. If a prompt receives more than 50 upvotes in 10 minutes, flag it.

```typescript
export const detectVoteAnomaly = inngest.createFunction(
  { id: 'votes.anomaly' },
  { event: 'upvote/created' },
  async ({ event, step }) => {
    const { promptId } = event.data

    const recentVotes = await step.run('count-recent-votes', async () => {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000) // 10 min ago
      return db.select({ count: count() })
        .from(upvotes)
        .where(and(
          eq(upvotes.promptId, promptId),
          gte(upvotes.createdAt, cutoff)
        ))
    })

    if (recentVotes[0].count > 50) {
      await step.run('flag-prompt', async () => {
        await db.update(prompts)
          .set({ flagged: true })
          .where(eq(prompts.id, promptId))
      })
      // TODO: send alert to admin (Phase 08)
    }
  }
)
```

Note: Add `flagged boolean default false` column to the `prompts` table (migration).

### 6. Creator Notification Job

**Trigger:** Event — fires when a new prompt is published

Notifies followers of the creator via email (Resend).

```typescript
export const notifyFollowers = inngest.createFunction(
  { id: 'notify.new_prompt' },
  { event: 'prompt/published' },
  async ({ event, step }) => {
    const { promptId, creatorId } = event.data

    const [prompt, followers] = await step.run('fetch-data', async () => {
      return Promise.all([
        db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1),
        db.select({ email: users.email, username: users.username })
          .from(follows)
          .innerJoin(users, eq(follows.followerId, users.id))
          .where(eq(follows.followingId, creatorId))
      ])
    })

    // Batch send — max 50 emails per Inngest step to avoid timeouts
    const batches = chunk(followers, 50)
    for (const batch of batches) {
      await step.run(`send-emails-batch`, async () => {
        await resend.emails.send({
          from: 'TopPrompt <hello@topprompt.dev>',
          to: batch.map(f => f.email),
          subject: `New prompt from ${prompt[0].title}`,
          // React Email template
          react: NewPromptEmail({ prompt: prompt[0] }),
        })
      })
    }
  }
)
```

### 7. Emit Events from the Web App

Wire up event emission in the tRPC procedures:

```typescript
// In upvotes.toggle procedure, after inserting an upvote:
await inngest.send({ name: 'upvote/created', data: { promptId, userId } })

// In prompts.create procedure, after inserting:
await inngest.send({ name: 'prompt/published', data: { promptId, creatorId } })
```

### 8. Inngest Dev Server

For local development, run the Inngest dev server alongside Next.js:

```bash
pnpm dlx inngest-cli@latest dev
```

Add to root `turbo.json` dev pipeline so it starts automatically.

---

## Acceptance Criteria

- [ ] Inngest dashboard shows all registered functions
- [ ] Leaderboard recompute cron fires every 5 minutes (verify in Inngest UI)
- [ ] Reddit aggregation pulls posts from at least 3 subreddits
- [ ] Aggregated posts appear in the DB with correct `sourceUrl` attribution
- [ ] HN aggregation pulls stories with `points >= 10`
- [ ] Vote anomaly detection flags a prompt after >50 upvotes in 10 minutes (test manually)
- [ ] Creator followers receive email when a new prompt is published
- [ ] All functions have retry logic (Inngest default: 3 retries)
- [ ] Functions visible in Inngest local dev UI during development

---

## Deliverables

- All Inngest functions in `apps/web/inngest/functions/`
- Reddit and HN aggregation pipeline with category inference
- Vote anomaly detection integrated with the upvote flow
- Creator notification emails via Resend
- `flagged` column migration added to `prompts` table
