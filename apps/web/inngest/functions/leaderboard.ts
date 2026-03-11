import { subDays } from 'date-fns'
import { db, prompts, desc, gte, eq } from '@toprompt/db'
import { getLeaderboard } from '@toprompt/db/queries'
import { redis } from '../../lib/redis'
import { inngest } from '../client'

export const recomputeLeaderboard = inngest.createFunction(
  { id: 'leaderboard.recompute' },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const cutoff = subDays(new Date(), 30)

    const recentPrompts = await step.run('fetch-recent-prompts', async () => {
      return db.select().from(prompts).where(gte(prompts.createdAt, cutoff))
    })

    await step.run('update-scores', async () => {
      for (const prompt of recentPrompts) {
        const hoursOld = (Date.now() - new Date(prompt.createdAt).getTime()) / 3_600_000
        const recency = 1 / Math.pow(hoursOld + 2, 1.5)
        const score =
          prompt.upvoteCount * 0.4 +
          prompt.saveCount * 0.35 +
          prompt.commentCount * 0.15 +
          recency * 0.1

        await db
          .update(prompts)
          .set({ score, updatedAt: new Date() })
          .where(eq(prompts.id, prompt.id))
      }
    })

    await step.run('cache-leaderboards', async () => {
      if (!redis) return

      const periods: Array<'week' | 'today' | 'alltime'> = ['week', 'today', 'alltime']
      for (const period of periods) {
        const results = await getLeaderboard(period, 50)
        await redis.set(`leaderboard:${period}`, results, { ex: 300 })
      }
    })

    return { updated: recentPrompts.length }
  }
)
