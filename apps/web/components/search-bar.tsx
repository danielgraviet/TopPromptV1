'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        type="search"
        placeholder="Search prompts..."
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 pr-10 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  )
}
