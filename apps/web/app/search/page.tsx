import Link from 'next/link'
import { PromptCard } from '@/components/prompt-card'
import { SearchBar } from '@/components/search-bar'
import { CATEGORIES } from '@/lib/categories'
import { getServerCaller } from '@/server/caller'

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const query = searchParams?.q?.trim() ?? ''
  const caller = await getServerCaller()
  const results = query ? await caller.prompts.search({ query, limit: 20 }) : []

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 max-w-xl">
        <h1 className="mb-4 text-2xl font-bold text-white">Search prompt files</h1>
        <SearchBar defaultValue={query} />
      </div>

      {!query ? (
        <div>
          <p className="mb-6 text-zinc-500">Browse the launch categories:</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-500">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>

          {results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-zinc-400">No prompts found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-zinc-600">Try a different keyword or browse by category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
