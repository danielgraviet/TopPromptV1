import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCreatorById, getPromptsByCreator } from '@toprompt/db/queries'
import { auth } from '@/auth'
import { db, follows, eq, and, sql } from '@toprompt/db'
import { PromptCard } from '@/components/prompt-card'
import { FollowButton } from '@/components/follow-button'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const creator = await getCreatorById(params.id)
  if (!creator) return {}
  const name = creator.name ?? creator.username ?? 'Anonymous'
  return {
    title: `${name}'s AI Prompts`,
    description: `Browse AI prompts by ${name} on TopPrompt.`,
    alternates: {
      canonical: `https://topprompt.io/user/${params.id}`,
    },
  }
}

export default async function CreatorPage({ params }: { params: { id: string } }) {
  const [creator, prompts, session] = await Promise.all([
    getCreatorById(params.id),
    getPromptsByCreator(params.id),
    auth(),
  ])

  if (!creator) notFound()

  const currentUserId = session?.user?.id as string | undefined
  const isOwnProfile = currentUserId === params.id

  const [followerCount, isFollowing] = await Promise.all([
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(follows)
      .where(eq(follows.followingId, params.id))
      .then((r) => r[0].count),
    currentUserId && !isOwnProfile
      ? db
          .select()
          .from(follows)
          .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, params.id)))
          .then((r) => r.length > 0)
      : Promise.resolve(false),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Profile header */}
      <div className="mb-10 flex flex-wrap items-center gap-5">
        {creator.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.image} alt={creator.name ?? 'Creator'} className="h-16 w-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {creator.name ?? creator.username ?? 'Anonymous'}
          </h1>
          {creator.username && <p className="text-sm text-zinc-500">@{creator.username}</p>}
        </div>

        <div className="ml-auto flex items-center gap-6">
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-white">{prompts.length}</p>
              <p className="text-xs text-zinc-500">Prompts</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {prompts.reduce((sum, p) => sum + p.upvoteCount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500">Upvotes</p>
            </div>
          </div>

          {!isOwnProfile && (
            <FollowButton
              targetId={params.id}
              initialFollowing={isFollowing}
              initialCount={followerCount}
            />
          )}
        </div>
      </div>

      {prompts.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">No prompts submitted yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </main>
  )
}
