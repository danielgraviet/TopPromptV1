'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'

export function SaveButton({
  promptId,
  initialCount,
  initialSaved = false,
  size = 'sm',
}: {
  promptId: string
  initialCount: number
  initialSaved?: boolean
  size?: 'sm' | 'lg'
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [count, setCount] = useState(initialCount)

  const toggle = trpc.saves.toggle.useMutation({
    onMutate: () => {
      setSaved((prev) => !prev)
      setCount((prev) => (saved ? prev - 1 : prev + 1))
    },
    onError: (err) => {
      setSaved((prev) => !prev)
      setCount((prev) => (saved ? prev + 1 : prev - 1))
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
        saved
          ? 'border-amber-500 bg-amber-600/20 text-amber-300'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
      } ${isLg ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'}`}
      aria-label={saved ? 'Remove save' : 'Save prompt'}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${isLg ? 'h-4 w-4' : 'h-3.5 w-3.5'} stroke-current stroke-2 ${saved ? 'fill-amber-400' : 'fill-none'}`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span>{count.toLocaleString()}</span>
    </button>
  )
}
