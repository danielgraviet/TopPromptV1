import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, users, accounts, sessions, verificationTokens, eq } from '@toprompt/db'

function getCandidateUsername(profile: Record<string, unknown> | undefined) {
  const raw =
    typeof profile?.login === 'string'
      ? profile.login
      : typeof profile?.preferred_username === 'string'
      ? profile.preferred_username
      : null

  if (!raw) return null

  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [GitHub, Google],
  callbacks: {
    signIn: async ({ user, profile }) => {
      if (!user.id) return true

      const existingRows = await db
        .select({
          name: users.name,
          image: users.image,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      const existing = existingRows[0]
      if (!existing) return true

      const updates: Partial<typeof users.$inferInsert> = {}

      if (user.name && user.name !== existing.name) {
        updates.name = user.name
      }

      if (user.image && user.image !== existing.image) {
        updates.image = user.image
      }

      if (!existing.username) {
        const candidateUsername = getCandidateUsername(
          profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : undefined
        )

        if (candidateUsername) {
          const takenRows = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, candidateUsername))
            .limit(1)

          if (takenRows.length === 0) {
            updates.username = candidateUsername
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id))
      }

      return true
    },
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
})
