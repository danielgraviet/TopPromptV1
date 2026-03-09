import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  promptText: text('prompt_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})
