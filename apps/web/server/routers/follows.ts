import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, follows, eq, and, sql } from '@toprompt/db'

export const followsRouter = router({
  toggle: protectedProcedure
    .input(z.object({ targetId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const followerId = ctx.user.id as string
      if (followerId === input.targetId) throw new TRPCError({ code: 'BAD_REQUEST', message: "You can't follow yourself." })

      const existing = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, input.targetId)))

      if (existing.length > 0) {
        await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, input.targetId)))
        return { following: false }
      } else {
        await db.insert(follows).values({ followerId, followingId: input.targetId })
        return { following: true }
      }
    }),

  status: publicProcedure
    .input(z.object({ targetId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) return false
      const followerId = ctx.session.user.id as string
      const rows = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, input.targetId)))
      return rows.length > 0
    }),

  followers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(follows)
        .where(eq(follows.followingId, input.userId))
      return count
    }),
})
