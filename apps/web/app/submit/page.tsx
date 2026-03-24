'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'
import { CATEGORIES } from '@/lib/categories'

export default function SubmitPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createPrompt = trpc.prompts.create.useMutation({
    onSuccess: (data) => {
      toast.success('Prompt submitted!')
      router.push(`/prompt/${data.slug}`)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newErrors: Record<string, string> = {}

    const title = (fd.get('title') as string).trim()
    const description = (fd.get('description') as string).trim()
    const promptText = (fd.get('promptText') as string).trim()
    const category = fd.get('category') as string

    if (title.length < 5) newErrors.title = 'Title must be at least 5 characters.'
    if (description.length < 10) newErrors.description = 'Description must be at least 10 characters.'
    if (promptText.length < 10) newErrors.promptText = 'Prompt text must be at least 10 characters.'
    if (!category) newErrors.category = 'Please select a category.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    createPrompt.mutate({
      title,
      description,
      promptText,
      category,
      tags: [],
      models: [],
      sourceUrl: undefined,
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-white">Submit a markdown prompt file</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Share a reusable setup prompt for `agents.md`, `claude.md`, or another system-level prompt.
        Paste the raw markdown exactly how you want people to use it.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <Field label="Title" error={errors.title} required>
          <input
            name="title"
            type="text"
            placeholder="e.g. Rails repo setup prompt for agents.md"
            className={inputCls(!!errors.title)}
          />
        </Field>

        {/* Description */}
        <Field label="Description" error={errors.description} required>
          <textarea
            name="description"
            rows={2}
            placeholder="What this setup prompt is for and when to use it"
            className={inputCls(!!errors.description)}
          />
        </Field>

        {/* Prompt text */}
        <Field
          label="Markdown"
          hint="Raw markdown file contents"
          error={errors.promptText}
          required
        >
          <textarea
            name="promptText"
            rows={12}
            placeholder={'# Role\nYou are...\n\n## Instructions\n- Inspect the codebase first\n- Ask clarifying questions only when blocked'}
            className={inputCls(!!errors.promptText)}
          />
        </Field>

        {/* Category */}
        <Field label="Category" error={errors.category} required>
          <select name="category" className={inputCls(!!errors.category)}>
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={createPrompt.isPending}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {createPrompt.isPending ? 'Submitting…' : 'Submit markdown file'}
        </button>
      </form>
    </main>
  )
}

function inputCls(hasError: boolean) {
  return `w-full rounded-lg border ${
    hasError ? 'border-red-500' : 'border-zinc-700'
  } bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none`
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-1 text-indigo-400">*</span>}
        {hint && <span className="ml-2 font-normal text-zinc-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
