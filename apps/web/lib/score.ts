import { db, prompts, eq } from '@toprompt/db'
import { invalidateLeaderboardCaches } from './leaderboard-cache'

export async function recomputeScore(
  promptId: string,
  upvoteCount: number,
  saveCount: number,
  commentCount: number,
  createdAt: Date
) {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600
  const recency = 1 / Math.pow(hoursOld + 2, 1.5)

  const newScore =
    upvoteCount * 0.4 +
    saveCount * 0.35 +
    commentCount * 0.15 +
    recency * 0.1

  const [current] = await db
    .select({ score: prompts.score })
    .from(prompts)
    .where(eq(prompts.id, promptId))

  await db.update(prompts).set({ score: newScore }).where(eq(prompts.id, promptId))

  if (current && Math.abs(newScore - current.score) > 10) {
    await invalidateLeaderboardCaches()
  }

  return newScore
}
