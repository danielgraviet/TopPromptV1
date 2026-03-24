'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'

export function UpvoteButton({
  promptId,
  initialCount,
  initialUpvoted = false,
  size = 'sm',
}: {
  promptId: string
  initialCount: number
  initialUpvoted?: boolean
  size?: 'sm' | 'lg'
}) {
  const router = useRouter()
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(initialCount)

  const toggle = trpc.upvotes.toggle.useMutation({
    onMutate: () => {
      const previous = { upvoted, count }
      const nextUpvoted = !previous.upvoted

      setUpvoted(nextUpvoted)
      setCount(previous.count + (nextUpvoted ? 1 : -1))

      return previous
    },
    onSuccess: (result) => {
      setUpvoted(result.upvoted)
      setCount(result.count)
    },
    onError: (err, _input, context) => {
      if (context) {
        setUpvoted(context.upvoted)
        setCount(context.count)
      }
      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/login')
      } else {
        toast.error(err.message)
      }
    },
  })

  const isLg = size === 'lg'

  return (
    <button
      onClick={() => toggle.mutate({ promptId })}
      disabled={toggle.isPending}
      className={`flex items-center gap-1.5 rounded-lg border transition-colors ${
        upvoted
          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
      } ${isLg ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'}`}
      aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${isLg ? 'h-4 w-4' : 'h-3.5 w-3.5'} fill-none stroke-current stroke-2`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span>{count.toLocaleString()}</span>
    </button>
  )
}
