'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'

export function FollowButton({
  targetId,
  initialFollowing,
  initialCount,
}: {
  targetId: string
  initialFollowing: boolean
  initialCount: number
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)

  const toggle = trpc.follows.toggle.useMutation({
    onMutate: () => {
      setFollowing((prev) => !prev)
      setCount((prev) => (following ? prev - 1 : prev + 1))
    },
    onError: (err) => {
      setFollowing((prev) => !prev)
      setCount((prev) => (following ? prev + 1 : prev - 1))
      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/login')
      } else {
        toast.error(err.message)
      }
    },
  })

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle.mutate({ targetId })}
        disabled={toggle.isPending}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          following
            ? 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-red-500 hover:text-red-400'
            : 'border-indigo-500 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
        }`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
      <span className="text-sm text-zinc-500">{count.toLocaleString()} followers</span>
    </div>
  )
}
