import { z } from 'zod'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import {
  getPromptFeed,
  getTrendingPrompts,
  getPromptsByCategory,
  searchPrompts,
  getPromptById,
  getPromptsByCreator,
  getCreatorById,
  getLeaderboard,
} from '@toprompt/db/queries'
import { db, prompts, promptTags, promptModels } from '@toprompt/db'
import { CATEGORY_SLUGS, AI_MODELS } from '../../lib/categories'

const createPromptInput = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(500),
  promptText: z.string().min(10).max(20000),
  category: z.enum(CATEGORY_SLUGS as unknown as [string, ...string[]]),
  tags: z.array(z.string().max(30)).max(10).default([]),
  models: z.array(z.enum(AI_MODELS as unknown as [string, ...string[]])).default([]),
  sourceUrl: z.string().url().optional().or(z.literal('')),
})

export const promptsRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(({ input }) => getPromptFeed(input?.limit)),

  trending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(({ input }) => getTrendingPrompts(input?.limit)),

  byCategory: publicProcedure
    .input(z.object({ category: z.string(), limit: z.number().min(1).max(50).default(20) }))
    .query(({ input }) => getPromptsByCategory(input.category, input.limit)),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(200), limit: z.number().min(1).max(50).default(20) }))
    .query(({ input }) => searchPrompts(input.query, input.limit)),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getPromptById(input.id)),

  byCreator: publicProcedure
    .input(z.object({ creatorId: z.string(), limit: z.number().min(1).max(50).default(20) }))
    .query(({ input }) => getPromptsByCreator(input.creatorId, input.limit)),

  creatorById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getCreatorById(input.id)),

  leaderboard: publicProcedure
    .input(z.object({ period: z.enum(['week', 'today', 'alltime']).default('week'), limit: z.number().min(1).max(50).default(50) }))
    .query(async ({ input }) => {
      const { redis } = await import('../../lib/redis')
      if (redis) {
        const cacheKey = `leaderboard:${input.period}`
        const cached = await redis.get(cacheKey)
        if (cached) return cached as Awaited<ReturnType<typeof getLeaderboard>>
        const results = await getLeaderboard(input.period, input.limit)
        await redis.set(cacheKey, results, { ex: 300 })
        return results
      }
      return getLeaderboard(input.period, input.limit)
    }),

  create: protectedProcedure
    .input(createPromptInput)
    .mutation(async ({ input, ctx }) => {
      const id = nanoid()
      const creatorId = ctx.user.id as string

      await db.insert(prompts).values({
        id,
        title: input.title,
        description: input.description,
        promptText: input.promptText,
        category: input.category,
        sourceUrl: input.sourceUrl ?? null,
        creatorId,
      })

      if (input.tags.length > 0) {
        await db.insert(promptTags).values(
          input.tags.map((tag) => ({ id: nanoid(), promptId: id, tag }))
        )
      }

      if (input.models.length > 0) {
        await db.insert(promptModels).values(
          input.models.map((modelName) => ({ id: nanoid(), promptId: id, modelName }))
        )
      }

      revalidatePath('/')
      revalidatePath(`/category/${input.category}`)

      return { id }
    }),
})
