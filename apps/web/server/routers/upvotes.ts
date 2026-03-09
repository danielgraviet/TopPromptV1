import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { nanoid } from 'nanoid'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, upvotes, prompts, eq, and, sql, gte } from '@toprompt/db'
import { recomputeScore } from '../../lib/score'
import { upvoteRatelimit } from '../../lib/ratelimit'

export const upvotesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id as string

      // Rate limiting
      if (upvoteRatelimit) {
        const { success } = await upvoteRatelimit.limit(userId)
        if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Slow down — too many upvotes.' })
      }

      const deleted = await db
        .delete(upvotes)
        .where(and(eq(upvotes.userId, userId), eq(upvotes.promptId, input.promptId)))
        .returning()

      let upvoted: boolean
      let updated: typeof prompts.$inferSelect

      if (deleted.length > 0) {
        // Was upvoted → remove it
        ;[updated] = await db
          .update(prompts)
          .set({ upvoteCount: sql`greatest(${prompts.upvoteCount} - 1, 0)` })
          .where(eq(prompts.id, input.promptId))
          .returning()
        upvoted = false
      } else {
        // Not upvoted → add it
        await db.insert(upvotes).values({ id: nanoid(), userId, promptId: input.promptId })
        ;[updated] = await db
          .update(prompts)
          .set({ upvoteCount: sql`${prompts.upvoteCount} + 1` })
          .where(eq(prompts.id, input.promptId))
          .returning()
        upvoted = true
      }

      const result = { upvoted, count: updated.upvoteCount, prompt: updated }

      // Recompute score
      await recomputeScore(
        input.promptId,
        result.prompt.upvoteCount,
        result.prompt.saveCount,
        result.prompt.commentCount,
        result.prompt.createdAt
      )

      // Vote anomaly check: >50 upvotes on this prompt in last 10 min
      if (result.upvoted) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        const [{ count }] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(upvotes)
          .where(and(eq(upvotes.promptId, input.promptId), gte(upvotes.createdAt, tenMinutesAgo)))
        if (count > 50) {
          await db.update(prompts).set({ flagged: true }).where(eq(prompts.id, input.promptId))
        }
      }

      return { upvoted: result.upvoted, count: result.count }
    }),

  byUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string
    const rows = await db
      .select({ promptId: upvotes.promptId })
      .from(upvotes)
      .where(eq(upvotes.userId, userId))
    return rows.map((r) => r.promptId)
  }),

  checkOne: publicProcedure
    .input(z.object({ promptId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) return false
      const rows = await db
        .select()
        .from(upvotes)
        .where(and(eq(upvotes.userId, ctx.session.user.id as string), eq(upvotes.promptId, input.promptId)))
      return rows.length > 0
    }),
})
