import { db, prompts, eq } from '@toprompt/db'

export async function recomputeScore(
  promptId: string,
  upvoteCount: number,
  saveCount: number,
  commentCount: number,
  createdAt: Date
) {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600
  const recency = 1 / Math.pow(hoursOld + 2, 1.5)

  const score =
    upvoteCount * 0.4 +
    saveCount * 0.35 +
    commentCount * 0.15 +
    recency * 0.1

  await db.update(prompts).set({ score }).where(eq(prompts.id, promptId))
  return score
}
