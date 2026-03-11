import { nanoid } from 'nanoid'
import { db, prompts, eq, BOT_USER_ID, seedBotUser } from '@toprompt/db'
import { inngest } from '../client'
import { inferCategory, extractPromptFromPost } from '../helpers'
import { generateSlug } from '../../lib/slug'

const SUBREDDITS = [
  { name: 'ChatGPT', query: 'prompt' },
  { name: 'ClaudeAI', query: null },
  { name: 'LocalLLaMA', query: 'system prompt' },
  { name: 'PromptEngineering', query: null },
  { name: 'artificial', query: 'prompt' },
]

export const aggregateReddit = inngest.createFunction(
  { id: 'aggregate.reddit' },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    let inserted = 0

    await step.run('ensure-bot-user', async () => {
      await seedBotUser()
    })

    for (const sub of SUBREDDITS) {
      const count = await step.run(`crawl-${sub.name}`, async () => {
        const url = sub.query
          ? `https://www.reddit.com/r/${sub.name}/search.json?q=${sub.query}&restrict_sr=1&sort=new&limit=25`
          : `https://www.reddit.com/r/${sub.name}/new.json?limit=25`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'TopPrompt/1.0 (prompt aggregator)' },
        })

        if (!res.ok) return 0

        const data = await res.json()
        const posts: RedditPost[] = data?.data?.children?.map((c: any) => c.data) ?? []

        let newCount = 0
        for (const post of posts) {
          if (post.score < 10 || post.selftext === '[deleted]' || !post.selftext) continue

          const sourceUrl = `https://reddit.com${post.permalink}`
          const existing = await db
            .select({ id: prompts.id })
            .from(prompts)
            .where(eq(prompts.sourceUrl, sourceUrl))
            .limit(1)

          if (existing.length > 0) continue

          const promptText = extractPromptFromPost(post.selftext)
          if (!promptText) continue

          const id = nanoid()
          await db.insert(prompts).values({
            id,
            slug: generateSlug(post.title, id),
            title: post.title.slice(0, 200),
            description: post.selftext.slice(0, 500),
            promptText,
            creatorId: BOT_USER_ID,
            category: inferCategory(post.title, post.selftext),
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

type RedditPost = {
  title: string
  selftext: string
  score: number
  permalink: string
  url: string
}
