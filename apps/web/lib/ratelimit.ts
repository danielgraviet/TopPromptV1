import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

function createRatelimit(tokens: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window) })
}

// 30 upvotes per user per minute
export const upvoteRatelimit = createRatelimit(30, '1 m')

// 5 comments per user per minute
export const commentRatelimit = createRatelimit(5, '1 m')
