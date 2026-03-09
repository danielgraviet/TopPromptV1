# Phase 04 — Community Features
**Status:** In progress — code complete, pending Upstash Redis setup for rate limiting + leaderboard cache
**Depends on:** Phase 03 (core web app)
**Blocks:** Phase 06 (background jobs — leaderboard recompute needs upvote/save data)

---

## Goal

Implement the community mechanics that drive quality signal: upvotes, saves, comments, follows, and the leaderboard scoring system. These are the core engagement loops. At the end of this phase, community interaction is fully functional and the ranking score updates in real time.

---

## Context

See `learnings/session-001-product-direction.md`:
> Quality signal is community-driven only (upvotes, saves, comments). Honest signal like GitHub stars.

Ranking formula:
```
Score =
(Upvotes * 0.4) +
(Saves * 0.35) +
(Comments * 0.15) +
(Recency * 0.1)

Recency = 1 / (hours_since_posted + 2)^1.5
```

---

## Packages

```
@upstash/redis
@upstash/ratelimit
```

---

## Tasks

### 1. Upvote System

**tRPC procedures:**
```
upvotes.toggle   — upvote or un-upvote a prompt (protected)
upvotes.byUser   — list of prompt IDs the current user has upvoted (protected)
```

**Behavior:**
- One upvote per user per prompt (enforced by unique constraint in DB)
- Toggling an existing upvote removes it
- On upvote: increment `prompts.upvote_count`, insert into `upvotes`
- On un-upvote: decrement `prompts.upvote_count`, delete from `upvotes`
- Run inside a DB transaction to keep count in sync

**Rate limiting (Upstash):**
- Max 30 upvotes per user per minute
- Block requests that exceed the limit with a 429 response

**UI:**
- Upvote button on prompt cards and prompt pages
- Filled/unfilled state based on whether the current user has upvoted
- Optimistic UI — count updates immediately before server confirms

### 2. Save System

**tRPC procedures:**
```
saves.toggle     — save or un-save a prompt (protected)
saves.list       — list of saved prompts for current user (protected)
```

**Behavior:**
- One save per user per prompt
- On save: increment `prompts.save_count`, insert into `saves`
- On un-save: decrement `prompts.save_count`, delete from `saves`
- Run inside a DB transaction

**UI:**
- Bookmark icon on prompt cards and prompt pages
- Filled/unfilled state
- `/saved` page showing the current user's saved prompts

### 3. Comments System

**tRPC procedures:**
```
comments.list    — paginated comments for a prompt (public)
comments.create  — post a comment (protected)
comments.delete  — delete own comment (protected)
```

**Behavior:**
- On create: increment `prompts.comment_count`
- On delete: decrement `prompts.comment_count`
- Users can only delete their own comments
- No nested comments (flat list, MVP)

**Rate limiting:**
- Max 5 comments per user per minute

**UI:**
- Comment section at the bottom of prompt pages
- Shows commenter avatar, username, timestamp, and body
- Textarea + submit button (protected — show sign-in prompt if not logged in)
- Delete button (only shown to comment author)

### 4. Follow System

**tRPC procedures:**
```
follows.toggle   — follow or unfollow a creator (protected)
follows.status   — check if current user follows a given creator (protected)
follows.followers — count for a user profile (public)
```

**Behavior:**
- Users cannot follow themselves
- Follower count shown on creator profiles

**UI:**
- Follow/Unfollow button on creator profile pages
- Optimistic toggle

### 5. Score Recompute (Synchronous)

After every upvote, save, or comment, synchronously update the prompt's `score` column using the ranking formula:

```typescript
const hoursOld = (Date.now() - prompt.createdAt.getTime()) / 1000 / 3600
const recency = 1 / Math.pow(hoursOld + 2, 1.5)

const score =
  (prompt.upvoteCount * 0.4) +
  (prompt.saveCount * 0.35) +
  (prompt.commentCount * 0.15) +
  (recency * 0.1)

await db.update(prompts).set({ score }).where(eq(prompts.id, promptId))
```

This keeps the score column current for instant leaderboard queries. Background recompute (Phase 06) will handle periodic batch corrections.

### 6. Leaderboard Pages

**tRPC procedures:**
```
prompts.leaderboard  — top N prompts by score (public, cached)
```

**Pages:**
- `/leaderboard` — global top prompts (this week)
- `/leaderboard/today` — top prompts in last 24h
- `/leaderboard/alltime` — all-time highest scored

Leaderboard queries are cached in Upstash Redis with a 5-minute TTL. Cache is invalidated when a prompt score updates significantly (delta > 10 points).

```typescript
const CACHE_KEY = 'leaderboard:weekly'
const TTL = 300 // 5 minutes

const cached = await redis.get(CACHE_KEY)
if (cached) return cached

const results = await db
  .select()
  .from(prompts)
  .where(gte(prompts.createdAt, subDays(new Date(), 7)))
  .orderBy(desc(prompts.score))
  .limit(50)

await redis.set(CACHE_KEY, results, { ex: TTL })
return results
```

### 7. Saved Prompts Page (`/saved`)

Protected route. Shows all prompts the current user has saved, sorted by save date.

### 8. Vote Anomaly Flag (Basic)

Simple velocity check on every upvote event:
- If a single prompt receives more than 50 upvotes in 10 minutes, flag it in the DB (`prompts.flagged = true`)
- Flagged prompts are hidden from leaderboards but still accessible via direct link
- Flagged prompts are reviewed in Phase 08 (admin tooling)

---

## Acceptance Criteria

- [ ] Upvoting a prompt increments the count and persists after page refresh
- [ ] Un-upvoting reverses the count
- [ ] Saving a prompt adds it to `/saved`
- [ ] Comment appears immediately after posting (optimistic)
- [ ] Rate limiting blocks excessive upvoting (test: send 31 upvote requests in 1 minute)
- [ ] Score column updates after every upvote/save/comment
- [ ] Leaderboard shows correct top prompts sorted by score
- [ ] Leaderboard is served from Redis cache on repeated requests
- [ ] Follow/unfollow persists and follower count updates on profile
- [ ] Flagging logic fires when vote velocity threshold is exceeded

---

## Deliverables

- Upvote, save, comment, and follow systems fully implemented
- Leaderboard pages with Redis caching
- `/saved` page for authenticated users
- Rate limiting middleware via Upstash
