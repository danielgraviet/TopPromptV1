import { z } from 'zod'
import { nanoid } from 'nanoid'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, saves, prompts, eq, and, sql } from '@toprompt/db'
import { recomputeScore } from '../../lib/score'
import { getSavedPrompts } from '@toprompt/db/queries'

export const savesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id as string

      const deleted = await db
        .delete(saves)
        .where(and(eq(saves.userId, userId), eq(saves.promptId, input.promptId)))
        .returning()

      let saved: boolean
      let updated: typeof prompts.$inferSelect

      if (deleted.length > 0) {
        ;[updated] = await db
          .update(prompts)
          .set({ saveCount: sql`greatest(${prompts.saveCount} - 1, 0)` })
          .where(eq(prompts.id, input.promptId))
          .returning()
        saved = false
      } else {
        await db.insert(saves).values({ id: nanoid(), userId, promptId: input.promptId })
        ;[updated] = await db
          .update(prompts)
          .set({ saveCount: sql`${prompts.saveCount} + 1` })
          .where(eq(prompts.id, input.promptId))
          .returning()
        saved = true
      }

      const result = { saved, count: updated.saveCount, prompt: updated }

      await recomputeScore(
        input.promptId,
        result.prompt.upvoteCount,
        result.prompt.saveCount,
        result.prompt.commentCount,
        result.prompt.createdAt
      )

      return { saved: result.saved, count: result.count }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getSavedPrompts(ctx.user.id as string)
  }),

  checkOne: publicProcedure
    .input(z.object({ promptId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) return false
      const rows = await db
        .select()
        .from(saves)
        .where(and(eq(saves.userId, ctx.session.user.id as string), eq(saves.promptId, input.promptId)))
      return rows.length > 0
    }),
})
