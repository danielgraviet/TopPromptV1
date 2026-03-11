import { redis } from './redis'
import { getLeaderboard } from '@toprompt/db/queries'

const TTL = 300 // 5 minutes

export type LeaderboardPeriod = 'week' | 'today' | 'alltime'

export async function getCachedLeaderboard(period: LeaderboardPeriod, limit = 50) {
  if (redis) {
    const cacheKey = `leaderboard:${period}`
    const cached = await redis.get(cacheKey)
    if (cached) return cached as Awaited<ReturnType<typeof getLeaderboard>>
    const results = await getLeaderboard(period, limit)
    await redis.set(cacheKey, results, { ex: TTL })
    return results
  }
  return getLeaderboard(period, limit)
}

export async function invalidateLeaderboardCaches() {
  if (!redis) return
  await Promise.all([
    redis.del('leaderboard:week'),
    redis.del('leaderboard:today'),
    redis.del('leaderboard:alltime'),
  ])
}
