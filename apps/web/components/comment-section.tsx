'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'

type Comment = {
  id: string
  body: string
  createdAt: Date | string
  userId: string
  userName: string | null
  userImage: string | null
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function CommentSection({
  promptId,
  initialComments,
  currentUserId,
  currentUserName,
  currentUserImage,
}: {
  promptId: string
  initialComments: Comment[]
  currentUserId?: string
  currentUserName?: string | null
  currentUserImage?: string | null
}) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')

  const utils = trpc.useUtils()

  const createComment = trpc.comments.create.useMutation({
    onMutate: () => {
      // Optimistic: add the comment immediately
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        userId: currentUserId!,
        userName: currentUserName ?? null,
        userImage: currentUserImage ?? null,
      }
      setComments((prev) => [...prev, tempComment])
      setBody('')
    },
    onSuccess: async () => {
      // Replace optimistic comment with real data (gets real ID for deletion)
      const fresh = await utils.comments.list.fetch({ promptId })
      setComments(fresh as unknown as Comment[])
    },
    onError: (err) => {
      // Revert optimistic comment
      setComments((prev) => prev.filter((c) => !c.id.startsWith('temp-')))
      setBody(body)
      if (err.data?.code === 'UNAUTHORIZED') router.push('/login')
      else toast.error(err.message)
    },
  })

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: (_, vars) => {
      setComments((prev) => prev.filter((c) => c.id !== vars.commentId))
    },
    onError: (err) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    createComment.mutate({ promptId, body: body.trim() })
  }

  return (
    <section className="mt-10">
      <h2 className="mb-6 text-lg font-semibold text-white">
        Comments <span className="text-zinc-500">({comments.length})</span>
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={currentUserId ? 'Add a comment…' : 'Sign in to comment'}
          disabled={!currentUserId}
          rows={3}
          className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        {currentUserId ? (
          <button
            type="submit"
            disabled={!body.trim() || createComment.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {createComment.isPending ? 'Posting…' : 'Post comment'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Sign in to comment
          </button>
        )}
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {comment.userImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comment.userImage} alt="" className="h-6 w-6 rounded-full" />
                  )}
                  <span className="text-sm font-medium text-zinc-300">
                    {comment.userName ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-zinc-600" suppressHydrationWarning>
                    {timeAgo(new Date(comment.createdAt))}
                  </span>
                </div>
                {currentUserId === comment.userId && !comment.id.startsWith('temp-') && (
                  <button
                    onClick={() => deleteComment.mutate({ commentId: comment.id, promptId })}
                    className="text-xs text-zinc-600 hover:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
