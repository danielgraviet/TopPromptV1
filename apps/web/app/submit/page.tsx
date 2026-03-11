'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc'
import { CATEGORIES, AI_MODELS } from '@/lib/categories'

export default function SubmitPage() {
  const router = useRouter()
  const [tags, setTags] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
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

  function toggleModel(model: string) {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newErrors: Record<string, string> = {}

    const title = (fd.get('title') as string).trim()
    const description = (fd.get('description') as string).trim()
    const promptText = (fd.get('promptText') as string).trim()
    const category = fd.get('category') as string
    const sourceUrl = (fd.get('sourceUrl') as string).trim()

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
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      models: selectedModels as never[],
      sourceUrl: sourceUrl || undefined,
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-white">Submit a Prompt</h1>
      <p className="mb-8 text-sm text-zinc-400">Share a prompt that&apos;s useful for developers.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <Field label="Title" error={errors.title} required>
          <input
            name="title"
            type="text"
            placeholder="e.g. Senior Engineer Code Review"
            className={inputCls(!!errors.title)}
          />
        </Field>

        {/* Description */}
        <Field label="Description" error={errors.description} required>
          <textarea
            name="description"
            rows={2}
            placeholder="Brief description of what this prompt does"
            className={inputCls(!!errors.description)}
          />
        </Field>

        {/* Prompt text */}
        <Field label="Prompt text" error={errors.promptText} required>
          <textarea
            name="promptText"
            rows={8}
            placeholder="The full prompt text..."
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

        {/* Compatible models */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Compatible models <span className="text-zinc-500">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AI_MODELS.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => toggleModel(model)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedModels.includes(model)
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <Field label="Tags" hint="Comma-separated, e.g. code-review, typescript">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="code-review, typescript, refactoring"
            className={inputCls(false)}
          />
        </Field>

        {/* Source URL */}
        <Field label="Source URL" hint="Optional — where did this prompt come from?">
          <input
            name="sourceUrl"
            type="url"
            placeholder="https://..."
            className={inputCls(false)}
          />
        </Field>

        <button
          type="submit"
          disabled={createPrompt.isPending}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {createPrompt.isPending ? 'Submitting…' : 'Submit prompt'}
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
