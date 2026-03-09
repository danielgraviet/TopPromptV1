import { cache } from 'react'
import { appRouter } from './routers'
import { createTRPCContext } from './trpc'

export const getServerCaller = cache(async () => {
  const ctx = await createTRPCContext()
  return appRouter.createCaller(ctx)
})
