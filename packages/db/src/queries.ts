import { eq, desc, inArray, sql, gte, and, or } from 'drizzle-orm'
import { db } from './index'
import { prompts, users, promptTags, promptModels, saves, comments } from './schema'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PromptSummary = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  upvoteCount: number
  saveCount: number
  score: number
  createdAt: Date
  creatorId: string
  creatorName: string | null
  creatorUsername: string | null
  creatorImage: string | null
  tags: string[]
  models: string[]
}

export type PromptDetail = PromptSummary & {
  promptText: string
  sourceUrl: string | null
  commentCount: number
  updatedAt: Date
}

// ─── Shared select shape ──────────────────────────────────────────────────────

const summarySelect = {
  id: prompts.id,
  slug: prompts.slug,
  title: prompts.title,
  description: prompts.description,
  category: prompts.category,
  upvoteCount: prompts.upvoteCount,
  saveCount: prompts.saveCount,
  score: prompts.score,
  createdAt: prompts.createdAt,
  creatorId: prompts.creatorId,
  creatorName: users.name,
  creatorUsername: users.username,
  creatorImage: users.image,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function withMeta<T extends { id: string }>(
  rows: T[]
): Promise<(T & { tags: string[]; models: string[] })[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [tags, models] = await Promise.all([
    db.select({ promptId: promptTags.promptId, tag: promptTags.tag })
      .from(promptTags)
      .where(inArray(promptTags.promptId, ids)),
    db.select({ promptId: promptModels.promptId, modelName: promptModels.modelName })
      .from(promptModels)
      .where(inArray(promptModels.promptId, ids)),
  ])
  return rows.map((r) => ({
    ...r,
    tags: tags.filter((t) => t.promptId === r.id).map((t) => t.tag),
    models: models.filter((m) => m.promptId === r.id).map((m) => m.modelName),
  }))
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const notFlagged = eq(prompts.flagged, false)

export async function getPromptFeed(limit = 20): Promise<PromptSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(notFlagged)
    .orderBy(desc(prompts.score))
    .limit(limit)
  return withMeta(rows)
}

export async function getTrendingPrompts(limit = 20): Promise<PromptSummary[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(and(notFlagged, gte(prompts.createdAt, oneDayAgo)))
    .orderBy(desc(prompts.score))
    .limit(limit)
  return withMeta(rows)
}

export async function getPromptsByCategory(
  category: string,
  limit = 20
): Promise<PromptSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(and(notFlagged, eq(prompts.category, category)))
    .orderBy(desc(prompts.score))
    .limit(limit)
  return withMeta(rows)
}

export async function getLeaderboard(
  period: 'week' | 'today' | 'alltime',
  limit = 50
): Promise<PromptSummary[]> {
  const now = Date.now()
  const since =
    period === 'today'
      ? new Date(now - 24 * 60 * 60 * 1000)
      : period === 'week'
      ? new Date(now - 7 * 24 * 60 * 60 * 1000)
      : null

  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(since ? and(notFlagged, gte(prompts.createdAt, since)) : notFlagged)
    .orderBy(desc(prompts.score))
    .limit(limit)
  return withMeta(rows)
}

export async function getSavedPrompts(userId: string): Promise<PromptSummary[]> {
  const savedRows = await db
    .select({ promptId: saves.promptId })
    .from(saves)
    .where(eq(saves.userId, userId))
    .orderBy(desc(saves.createdAt))

  if (savedRows.length === 0) return []
  const ids = savedRows.map((r) => r.promptId)

  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(inArray(prompts.id, ids))
  return withMeta(rows)
}

export async function getComments(promptId: string) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.promptId, promptId))
    .orderBy(desc(comments.createdAt))
}

export async function searchPrompts(query: string, limit = 20): Promise<PromptSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(sql`${prompts.searchVector} @@ plainto_tsquery('english', ${query})`)
    .orderBy(sql`ts_rank(${prompts.searchVector}, plainto_tsquery('english', ${query})) DESC`)
    .limit(limit)
  return withMeta(rows)
}

export async function getPromptsByCreator(
  creatorId: string,
  limit = 20
): Promise<PromptSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(eq(prompts.creatorId, creatorId))
    .orderBy(desc(prompts.createdAt))
    .limit(limit)
  return withMeta(rows)
}

export async function getPromptById(id: string): Promise<PromptDetail | null> {
  const rows = await db
    .select({
      ...summarySelect,
      promptText: prompts.promptText,
      sourceUrl: prompts.sourceUrl,
      commentCount: prompts.commentCount,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(eq(prompts.id, id))
    .limit(1)

  if (rows.length === 0) return null

  const [row] = await withMeta(rows)
  return {
    ...row,
    promptText: rows[0].promptText,
    sourceUrl: rows[0].sourceUrl,
    commentCount: rows[0].commentCount,
    updatedAt: rows[0].updatedAt,
  }
}

export async function getPromptBySlug(slug: string): Promise<PromptDetail | null> {
  const rows = await db
    .select({
      ...summarySelect,
      promptText: prompts.promptText,
      sourceUrl: prompts.sourceUrl,
      commentCount: prompts.commentCount,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
    .where(or(eq(prompts.slug, slug), eq(prompts.id, slug)))
    .limit(1)

  if (rows.length === 0) return null

  const [row] = await withMeta(rows)
  return {
    ...row,
    promptText: rows[0].promptText,
    sourceUrl: rows[0].sourceUrl,
    commentCount: rows[0].commentCount,
    updatedAt: rows[0].updatedAt,
  }
}

export async function getCreatorById(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0] ?? null
}
