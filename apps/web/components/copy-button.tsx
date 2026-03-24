'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 active:scale-95"
    >
      {copied ? (
        <>
          <CheckIcon />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon />
          Copy raw markdown
        </>
      )}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
