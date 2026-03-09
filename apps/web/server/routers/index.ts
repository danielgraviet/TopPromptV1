import { router } from '../trpc'
import { promptsRouter } from './prompts'
import { upvotesRouter } from './upvotes'
import { savesRouter } from './saves'
import { commentsRouter } from './comments'
import { followsRouter } from './follows'

export const appRouter = router({
  prompts: promptsRouter,
  upvotes: upvotesRouter,
  saves: savesRouter,
  comments: commentsRouter,
  follows: followsRouter,
})

export type AppRouter = typeof appRouter
