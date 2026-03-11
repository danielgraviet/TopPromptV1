import { db, upvotes, prompts, eq, and, gte, sql } from '@toprompt/db'
import { inngest } from '../client'

export const detectVoteAnomaly = inngest.createFunction(
  { id: 'votes.anomaly' },
  { event: 'upvote/created' },
  async ({ event, step }) => {
    const { promptId } = event.data as { promptId: string }

    const recent = await step.run('count-recent-upvotes', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(upvotes)
        .where(and(eq(upvotes.promptId, promptId), gte(upvotes.createdAt, tenMinutesAgo)))

      return count ?? 0
    })

    if (recent > 50) {
      await step.run('flag-prompt', async () => {
        await db.update(prompts).set({ flagged: true }).where(eq(prompts.id, promptId))
      })
      return { flagged: true, recent }
    }

    return { flagged: false, recent }
  }
)
