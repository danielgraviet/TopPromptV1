'use client'

import Link from 'next/link'
import type { PromptSummary } from '@toprompt/db/queries'

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
  coding:       'bg-blue-900/50 text-blue-300',
  architecture: 'bg-purple-900/50 text-purple-300',
  debugging:    'bg-red-900/50 text-red-300',
  devops:       'bg-orange-900/50 text-orange-300',
  startup:      'bg-green-900/50 text-green-300',
  writing:      'bg-yellow-900/50 text-yellow-300',
  automation:   'bg-cyan-900/50 text-cyan-300',
  business:     'bg-pink-900/50 text-pink-300',
}

export function PromptCard({ prompt }: { prompt: PromptSummary }) {
  const categoryColor = CATEGORY_COLORS[prompt.category] ?? 'bg-zinc-800 text-zinc-300'

  return (
    <article className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600">
      {/* Stretched link covers the whole card */}
      <Link href={`/prompt/${prompt.slug}`} className="absolute inset-0 rounded-xl" aria-label={prompt.title} />

      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
          {prompt.category}
        </span>
        <span className="text-xs text-zinc-500" suppressHydrationWarning>
          {timeAgo(prompt.createdAt)}
        </span>
      </div>

      <h2 className="mb-1.5 text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
        {prompt.title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400 line-clamp-2">{prompt.description}</p>

      {prompt.models.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {prompt.models.slice(0, 3).map((model) => (
            <span key={model} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {model}
            </span>
          ))}
          {prompt.models.length > 3 && (
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
              +{prompt.models.length - 3}
            </span>
          )}
        </div>
      )}

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

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <UpvoteIcon />
            {prompt.upvoteCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <SaveIcon />
            {prompt.saveCount.toLocaleString()}
          </span>
        </div>
      </div>
    </article>
  )
}

function UpvoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}
