import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '../auth'
import { db } from '@toprompt/db'

export const createTRPCContext = async (opts?: { req?: Request }) => {
  const session = await auth()

  // If no web session, check for extension identity header.
  // The extension sends the userId it received during the OAuth callback flow.
  // This is not a cryptographic proof — harden in Phase 08 if needed.
  let effectiveSession = session
  if (!effectiveSession?.user && opts?.req) {
    const extensionUserId = opts.req.headers.get('x-extension-user-id')
    if (extensionUserId) {
      effectiveSession = { user: { id: extensionUserId } } as typeof session
    }
  }

  return { session: effectiveSession, db }
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.session.user } })
})
