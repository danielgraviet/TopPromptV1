import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { inngest } from '../../inngest/client'
import { generateSlug } from '../../lib/slug'
import {
  getPromptFeed,
  getTrendingPrompts,
  getPromptsByCategory,
  searchPrompts,
  getPromptById,
  getPromptsByCreator,
  getCreatorById,
} from '@toprompt/db/queries'
import { db, prompts, promptTags, promptModels, eq } from '@toprompt/db'
import { CATEGORY_SLUGS } from '../../lib/categories'

const createPromptInput = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(500),
  promptText: z.string().min(10).max(20000),
  category: z.enum(CATEGORY_SLUGS as unknown as [string, ...string[]]),
  tags: z.array(z.string().max(30)).max(10).default([]),
  models: z.array(z.string().max(60)).max(10).default([]),
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
      const { getCachedLeaderboard } = await import('../../lib/leaderboard-cache')
      return getCachedLeaderboard(input.period, input.limit)
    }),

  create: protectedProcedure
    .input(createPromptInput)
    .mutation(async ({ input, ctx }) => {
      const id = nanoid()
      const creatorId = ctx.user.id as string
      const slug = generateSlug(input.title, id)

      await db.insert(prompts).values({
        id,
        slug,
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

      void inngest
        .send({ name: 'prompt/published', data: { promptId: id, creatorId } })
        .catch(() => null)

      return { id, slug }
    }),

  delete: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id as string

      const existingRows = await db
        .select({
          id: prompts.id,
          slug: prompts.slug,
          category: prompts.category,
          creatorId: prompts.creatorId,
        })
        .from(prompts)
        .where(eq(prompts.id, input.promptId))
        .limit(1)

      const prompt = existingRows[0]

      if (!prompt) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Prompt not found.' })
      }

      if (prompt.creatorId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own prompts.' })
      }

      await db.delete(prompts).where(eq(prompts.id, input.promptId))

      revalidatePath('/')
      revalidatePath(`/prompt/${prompt.slug}`)
      revalidatePath(`/category/${prompt.category}`)
      revalidatePath(`/user/${userId}`)
      revalidatePath('/leaderboard')
      revalidatePath('/leaderboard/today')
      revalidatePath('/leaderboard/alltime')

      return { success: true }
    }),
})
