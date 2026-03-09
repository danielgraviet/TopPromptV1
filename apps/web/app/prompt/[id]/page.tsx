import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { getCategoryBySlug } from '@/lib/categories'
import { getServerCaller } from '@/server/caller'

export const revalidate = 60

export default async function PromptPage({ params }: { params: { id: string } }) {
  const caller = await getServerCaller()
  const prompt = await caller.prompts.byId({ id: params.id })
  if (!prompt) notFound()

  const category = getCategoryBySlug(prompt.category)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">Home</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/category/${prompt.category}`} className="hover:text-white">
              {category.label}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-zinc-400">{prompt.title}</span>
      </nav>

      {/* Title + meta */}
      <div className="mb-6">
        <h1 className="mb-3 text-2xl font-bold text-white">{prompt.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Link
              href={`/category/${prompt.category}`}
              className="rounded-md bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30"
            >
              {category.label}
            </Link>
          )}
          {prompt.models.map((model) => (
            <span key={model} className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              {model}
            </span>
          ))}
          {prompt.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-500">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Creator card */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {prompt.creatorImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prompt.creatorImage}
            alt={prompt.creatorName ?? 'Creator'}
            className="h-10 w-10 rounded-full"
          />
        )}
        <div>
          <Link
            href={`/user/${prompt.creatorId}`}
            className="text-sm font-medium text-white hover:text-indigo-300"
          >
            {prompt.creatorName ?? 'Anonymous'}
          </Link>
          <p className="text-xs text-zinc-500">
            {new Date(prompt.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-zinc-500">
          <span>▲ {prompt.upvoteCount.toLocaleString()}</span>
          <span>⊕ {prompt.saveCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Description */}
      <p className="mb-6 text-zinc-300">{prompt.description}</p>

      {/* Source URL */}
      {prompt.sourceUrl && (
        <div className="mb-6">
          <a
            href={prompt.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            ↗ Source
          </a>
        </div>
      )}

      {/* Prompt text — primary content */}
      <div className="mb-4 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Prompt
          </span>
          <CopyButton text={prompt.promptText} />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap p-6 text-sm leading-relaxed text-zinc-200">
          {prompt.promptText}
        </pre>
      </div>
    </main>
  )
}
