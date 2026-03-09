import { router } from '../trpc'
import { promptsRouter } from './prompts'

export const appRouter = router({
  prompts: promptsRouter,
})

export type AppRouter = typeof appRouter
