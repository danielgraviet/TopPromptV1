/**
 * Seeds the TopPrompt bot user used for aggregated content (Reddit, HN).
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 *
 * Usage: npx ts-node -e "require('./seed-bot-user')"
 * Or call seedBotUser() from a migration/startup script.
 */
import { db } from './index'
import { users } from './schema'
import { sql } from 'drizzle-orm'

export const BOT_USER_ID = 'toprompt-bot'

export async function seedBotUser() {
  await db.execute(sql`
    INSERT INTO users (id, name, email, created_at)
    VALUES (${BOT_USER_ID}, 'TopPrompt Bot', 'bot@topprompt.io', NOW())
    ON CONFLICT (id) DO NOTHING
  `)
  console.log('Bot user seeded.')
}
