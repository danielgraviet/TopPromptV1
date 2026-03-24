'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'

export function DeletePromptButton({ promptId }: { promptId: string }) {
  const router = useRouter()

  const deletePrompt = trpc.prompts.delete.useMutation({
    onSuccess: () => {
      toast.success('Prompt deleted.')
      router.push('/')
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function handleDelete() {
    const confirmed = window.confirm('Delete this prompt? This cannot be undone.')
    if (!confirmed) return
    deletePrompt.mutate({ promptId })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deletePrompt.isPending}
      className="rounded-lg border border-red-900/80 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:opacity-50"
    >
      {deletePrompt.isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
