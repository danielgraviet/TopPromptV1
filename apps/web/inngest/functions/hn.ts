import { nanoid } from 'nanoid'
import { db, prompts, eq, BOT_USER_ID, seedBotUser } from '@toprompt/db'
import { inngest } from '../client'
import { inferCategory } from '../helpers'
import { generateSlug } from '../../lib/slug'

const HN_QUERIES = [
  'prompt engineering',
  'system prompt',
  'LLM prompt',
  'Claude prompt',
]

export const aggregateHN = inngest.createFunction(
  { id: 'aggregate.hn' },
  { cron: '0 */12 * * *' },
  async ({ step }) => {
    let inserted = 0

    await step.run('ensure-bot-user', async () => {
      await seedBotUser()
    })

    for (const query of HN_QUERIES) {
      const count = await step.run(`crawl-hn-${query.replace(/\s+/g, '-')}`, async () => {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`
        const res = await fetch(url)

        if (!res.ok) return 0

        const data = await res.json()
        const hits: HNHit[] = data?.hits ?? []

        let newCount = 0
        for (const hit of hits) {
          if ((hit.points ?? 0) < 10) continue

          const sourceUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`
          const existing = await db
            .select({ id: prompts.id })
            .from(prompts)
            .where(eq(prompts.sourceUrl, sourceUrl))
            .limit(1)

          if (existing.length > 0) continue

          const promptText = hit.story_text ?? hit.title
          if (!promptText || promptText.length < 20) continue

          const id = nanoid()
          await db.insert(prompts).values({
            id,
            slug: generateSlug(hit.title, id),
            title: hit.title.slice(0, 200),
            description: `From Hacker News — ${hit.points ?? 0} points`,
            promptText: promptText.slice(0, 20000),
            creatorId: BOT_USER_ID,
            category: inferCategory(hit.title, hit.story_text ?? ''),
            sourceUrl,
            upvoteCount: 0,
            saveCount: 0,
            commentCount: 0,
            score: 0,
          })

          newCount++
        }

        return newCount
      })

      inserted += count
    }

    return { inserted }
  }
)

type HNHit = {
  objectID: string
  title: string
  story_text?: string
  points?: number
  url?: string
}
