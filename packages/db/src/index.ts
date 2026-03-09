import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL_POOLED or DATABASE_URL environment variable is not set')
}

export const db = drizzle(neon(connectionString))

export * from './schema'
export { sql, eq, ne, desc, asc, and, or, inArray, gte, lte, lt, gt, isNull } from 'drizzle-orm'
