import { eq, desc, inArray, sql, gte } from 'drizzle-orm'
import { db } from './index'
import { prompts, users, promptTags, promptModels } from './schema'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PromptSummary = {
  id: string
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
}

// ─── Shared select shape ──────────────────────────────────────────────────────

const summarySelect = {
  id: prompts.id,
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

export async function getPromptFeed(limit = 20): Promise<PromptSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(prompts)
    .leftJoin(users, eq(prompts.creatorId, users.id))
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
    .where(gte(prompts.createdAt, oneDayAgo))
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
    .where(eq(prompts.category, category))
    .orderBy(desc(prompts.score))
    .limit(limit)
  return withMeta(rows)
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
