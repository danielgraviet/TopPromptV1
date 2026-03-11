import Link from 'next/link'
import type { Metadata } from 'next'
import { PromptCard } from '@/components/prompt-card'
import { CATEGORIES } from '@/lib/categories'
import { getServerCaller } from '@/server/caller'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'TopPrompt — The Developer Prompt Library',
  description: 'Discover and share the best AI prompts for developers. Community-ranked prompts for Claude, GPT-4o, and more.',
  alternates: { canonical: 'https://topprompt.io' },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  const tab = searchParams?.tab === 'trending' ? 'trending' : 'recent'
  const caller = await getServerCaller()
  const prompts =
    tab === 'trending'
      ? await caller.prompts.trending({ limit: 20 })
      : await caller.prompts.list({ limit: 20 })

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">
          The best AI prompts,{' '}
          <span className="text-indigo-400">curated by developers</span>
        </h1>
        <p className="text-zinc-400">
          Discover, share, and save prompts for Claude, GPT-4o, and more.
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-full border border-indigo-500 bg-indigo-600/20 px-3 py-1 text-sm text-indigo-300"
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Feed tabs */}
      <div className="mb-6 flex gap-4 border-b border-zinc-800">
        <Link
          href="/?tab=recent"
          className={`pb-3 text-sm font-medium transition-colors ${
            tab === 'recent'
              ? 'border-b-2 border-indigo-500 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Recent
        </Link>
        <Link
          href="/?tab=trending"
          className={`pb-3 text-sm font-medium transition-colors ${
            tab === 'trending'
              ? 'border-b-2 border-indigo-500 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Trending
        </Link>
      </div>

      {/* Prompt grid */}
      {prompts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500">No prompts yet.</p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Submit the first one
          </Link>
        </div>
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
