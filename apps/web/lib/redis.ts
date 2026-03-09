import { Redis } from '@upstash/redis'

// Redis is optional — if env vars are missing the app still works, caching is just skipped
function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export const redis = createRedis()
