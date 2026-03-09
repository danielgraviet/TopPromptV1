import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { nanoid } from 'nanoid'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, comments, prompts, eq, and, sql } from '@toprompt/db'
import { recomputeScore } from '../../lib/score'
import { commentRatelimit } from '../../lib/ratelimit'
import { getComments } from '@toprompt/db/queries'

export const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ promptId: z.string() }))
    .query(({ input }) => getComments(input.promptId)),

  create: protectedProcedure
    .input(z.object({ promptId: z.string(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id as string

      if (commentRatelimit) {
        const { success } = await commentRatelimit.limit(userId)
        if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many comments — slow down.' })
      }

      await db.insert(comments).values({
        id: nanoid(),
        userId,
        promptId: input.promptId,
        body: input.body,
      })

      const [updated] = await db
        .update(prompts)
        .set({ commentCount: sql`${prompts.commentCount} + 1` })
        .where(eq(prompts.id, input.promptId))
        .returning()

      await recomputeScore(
        input.promptId,
        updated.upvoteCount,
        updated.saveCount,
        updated.commentCount,
        updated.createdAt
      )

      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.string(), promptId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id as string

      const [comment] = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, input.commentId), eq(comments.userId, userId)))

      if (!comment) throw new TRPCError({ code: 'FORBIDDEN' })

      await db.delete(comments).where(eq(comments.id, input.commentId))

      const [updated] = await db
        .update(prompts)
        .set({ commentCount: sql`${prompts.commentCount} - 1` })
        .where(eq(prompts.id, input.promptId))
        .returning()

      await recomputeScore(
        input.promptId,
        updated.upvoteCount,
        updated.saveCount,
        updated.commentCount,
        updated.createdAt
      )

      return { success: true }
    }),
})
