import { Resend } from 'resend'
import { db, prompts, users, follows, eq } from '@toprompt/db'
import { inngest } from '../client'

function createResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

// Chunk array into batches
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export const notifyFollowers = inngest.createFunction(
  { id: 'notify.new_prompt' },
  { event: 'prompt/published' },
  async ({ event, step }) => {
    const { promptId, creatorId } = event.data as { promptId: string; creatorId: string }

    const resend = createResend()
    if (!resend) {
      return { skipped: true, reason: 'RESEND_API_KEY not configured' }
    }

    const [promptRows, followerRows] = await step.run('fetch-data', async () => {
      return Promise.all([
        db.select().from(prompts).where(eq(prompts.id, promptId)).limit(1),
        db
          .select({ email: users.email, name: users.name })
          .from(follows)
          .innerJoin(users, eq(follows.followerId, users.id))
          .where(eq(follows.followingId, creatorId)),
      ])
    })

    if (promptRows.length === 0 || followerRows.length === 0) {
      return { sent: 0 }
    }

    const prompt = promptRows[0]
    const batches = chunk(followerRows, 50)
    let sent = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      await step.run(`send-emails-batch-${i}`, async () => {
        await resend.emails.send({
          from: 'TopPrompt <hello@topprompt.io>',
          to: batch.map((f) => f.email),
          subject: `New prompt: ${prompt.title}`,
          html: `
            <h2>New prompt from a creator you follow</h2>
            <h3>${prompt.title}</h3>
            <p>${prompt.description}</p>
            <a href="https://topprompt.io/prompt/${prompt.id}">View prompt</a>
          `,
        })
      })
      sent += batch.length
    }

    return { sent }
  }
)
