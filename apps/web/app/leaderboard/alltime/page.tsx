import Link from 'next/link'
import { getCachedLeaderboard } from '@/lib/leaderboard-cache'
import { PromptCard } from '@/components/prompt-card'

export const revalidate = 600

export default async function AllTimeLeaderboardPage() {
  const prompts = await getCachedLeaderboard('alltime')

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mb-6 text-zinc-400">All-time highest scored prompts.</p>

        <div className="flex gap-3">
          <Link href="/leaderboard" className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 hover:text-white">
            This week
          </Link>
          <Link href="/leaderboard/today" className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 hover:text-white">
            Today
          </Link>
          <span className="rounded-full border border-indigo-500 bg-indigo-600/20 px-3 py-1 text-sm text-indigo-300">
            All time
          </span>
        </div>
      </div>

      {prompts.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">No prompts yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt, i) => (
            <div key={prompt.id} className="relative">
              {i < 3 && (
                <span className="absolute -left-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow">
                  {i + 1}
                </span>
              )}
              <PromptCard prompt={prompt} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
