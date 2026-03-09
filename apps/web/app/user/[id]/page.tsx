import { notFound } from 'next/navigation'
import { PromptCard } from '@/components/prompt-card'
import { getServerCaller } from '@/server/caller'

export const revalidate = 60

export default async function CreatorPage({ params }: { params: { id: string } }) {
  const caller = await getServerCaller()
  const [creator, prompts] = await Promise.all([
    caller.prompts.creatorById({ id: params.id }),
    caller.prompts.byCreator({ creatorId: params.id, limit: 20 }),
  ])

  if (!creator) notFound()

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Profile header */}
      <div className="mb-10 flex items-center gap-5">
        {creator.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.image}
            alt={creator.name ?? 'Creator'}
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {creator.name ?? creator.username ?? 'Anonymous'}
          </h1>
          {creator.username && (
            <p className="text-sm text-zinc-500">@{creator.username}</p>
          )}
        </div>
        <div className="ml-auto flex gap-6 text-center">
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
      </div>

      {/* Prompts grid */}
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
