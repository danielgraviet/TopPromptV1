'use client'

import Link from 'next/link'
import type { PromptSummary } from '@toprompt/db/queries'
import { UpvoteButton } from './upvote-button'
import { trpc } from '@/lib/trpc'
import { getCategoryLabel } from '@/lib/categories'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const CATEGORY_COLORS: Record<string, string> = {
  'agents-md': 'bg-sky-950/70 text-sky-300',
  'claude-md': 'bg-amber-950/70 text-amber-300',
  'system-prompts': 'bg-emerald-950/70 text-emerald-300',
}

export function PromptCard({ prompt }: { prompt: PromptSummary }) {
  const categoryColor = CATEGORY_COLORS[prompt.category] ?? 'bg-zinc-800 text-zinc-300'
  const { data: upvotedPromptIds = [] } = trpc.upvotes.byUser.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  })
  const initialUpvoted = upvotedPromptIds.includes(prompt.id)

  return (
    <article className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600">
      {/* Stretched link covers the whole card */}
      <Link href={`/prompt/${prompt.slug}`} className="absolute inset-0 rounded-xl" aria-label={prompt.title} />

      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
          {getCategoryLabel(prompt.category)}
        </span>
        <span className="text-xs text-zinc-500" suppressHydrationWarning>
          {timeAgo(prompt.createdAt)}
        </span>
      </div>

      <h2 className="mb-1.5 text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
        {prompt.title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400 line-clamp-2">{prompt.description}</p>

      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
        Setup prompt
      </p>

      <div className="flex items-center justify-between">
        <div className="relative z-10 flex items-center gap-2">
          {prompt.creatorImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={prompt.creatorImage}
              alt={prompt.creatorName ?? 'Creator'}
              className="h-5 w-5 rounded-full"
            />
          )}
          <Link
            href={`/user/${prompt.creatorId}`}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            {prompt.creatorName ?? 'Anonymous'}
          </Link>
        </div>

        <div className="relative z-10">
          <UpvoteButton
            promptId={prompt.id}
            initialCount={prompt.upvoteCount}
            initialUpvoted={initialUpvoted}
          />
        </div>
      </div>
    </article>
  )
}
