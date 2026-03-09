import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '../auth'
import { db } from '@toprompt/db'

export const createTRPCContext = async () => {
  const session = await auth()
  return { session, db }
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.session.user } })
})
