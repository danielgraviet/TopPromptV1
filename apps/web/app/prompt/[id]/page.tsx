import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPromptById, getComments } from '@toprompt/db/queries'
import { auth } from '@/auth'
import { db, upvotes, saves, eq, and } from '@toprompt/db'
import { CopyButton } from '@/components/copy-button'
import { UpvoteButton } from '@/components/upvote-button'
import { SaveButton } from '@/components/save-button'
import { CommentSection } from '@/components/comment-section'
import { getCategoryBySlug } from '@/lib/categories'

export const revalidate = 60

export default async function PromptPage({ params }: { params: { id: string } }) {
  const [prompt, session] = await Promise.all([
    getPromptById(params.id),
    auth(),
  ])
  if (!prompt) notFound()

  const userId = session?.user?.id as string | undefined
  const category = getCategoryBySlug(prompt.category)

  const [initialComments, isUpvoted, isSaved] = await Promise.all([
    getComments(params.id),
    userId
      ? db.select().from(upvotes).where(and(eq(upvotes.userId, userId), eq(upvotes.promptId, params.id))).then((r) => r.length > 0)
      : Promise.resolve(false),
    userId
      ? db.select().from(saves).where(and(eq(saves.userId, userId), eq(saves.promptId, params.id))).then((r) => r.length > 0)
      : Promise.resolve(false),
  ])

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

      {/* Title */}
      <h1 className="mb-4 text-2xl font-bold text-white">{prompt.title}</h1>

      {/* Meta row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
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

        <div className="ml-auto flex items-center gap-2">
          <UpvoteButton promptId={prompt.id} initialCount={prompt.upvoteCount} initialUpvoted={isUpvoted} size="lg" />
          <SaveButton promptId={prompt.id} initialCount={prompt.saveCount} initialSaved={isSaved} size="lg" />
        </div>
      </div>

      {/* Creator card */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {prompt.creatorImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prompt.creatorImage} alt={prompt.creatorName ?? 'Creator'} className="h-10 w-10 rounded-full" />
        )}
        <div>
          <Link href={`/user/${prompt.creatorId}`} className="text-sm font-medium text-white hover:text-indigo-300">
            {prompt.creatorName ?? 'Anonymous'}
          </Link>
          <p className="text-xs text-zinc-500" suppressHydrationWarning>
            {new Date(prompt.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <p className="mb-6 text-zinc-300">{prompt.description}</p>

      {prompt.sourceUrl && (
        <div className="mb-6">
          <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300">
            ↗ Source
          </a>
        </div>
      )}

      {/* Prompt text */}
      <div className="mb-4 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Prompt</span>
          <CopyButton text={prompt.promptText} />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap p-6 text-sm leading-relaxed text-zinc-200">
          {prompt.promptText}
        </pre>
      </div>

      <CommentSection
        promptId={prompt.id}
        initialComments={initialComments}
        currentUserId={userId}
        currentUserName={session?.user?.name}
        currentUserImage={session?.user?.image}
      />
    </main>
  )
}
