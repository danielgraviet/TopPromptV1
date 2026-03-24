import type { ReactNode } from 'react'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; code: string }

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.95em] text-zinc-100"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return part
  })
}

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []

  let paragraph: string[] = []
  let listItems: string[] = []
  let quoteLines: string[] = []
  let codeLines: string[] = []
  let inCodeBlock = false

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems })
      listItems = []
    }
  }

  function flushQuote() {
    if (quoteLines.length > 0) {
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') })
      quoteLines = []
    }
  }

  function flushCode() {
    if (codeLines.length > 0) {
      blocks.push({ type: 'code', code: codeLines.join('\n') })
      codeLines = []
    }
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushParagraph()
      flushList()
      flushQuote()

      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }

      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    const trimmed = line.trim()

    if (trimmed === '') {
      flushParagraph()
      flushList()
      flushQuote()
      continue
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushQuote()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      })
      continue
    }

    const listMatch = /^[-*]\s+(.*)$/.exec(trimmed)
    if (listMatch) {
      flushParagraph()
      flushQuote()
      listItems.push(listMatch[1])
      continue
    }

    const quoteMatch = /^>\s?(.*)$/.exec(trimmed)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteLines.push(quoteMatch[1])
      continue
    }

    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushQuote()
  flushCode()

  return blocks
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown)

  return (
    <div className="markdown-preview space-y-4 p-6 text-sm leading-7 text-zinc-200">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const className =
            block.level === 1
              ? 'text-2xl font-semibold text-white'
              : block.level === 2
              ? 'text-xl font-semibold text-white'
              : 'text-base font-semibold text-white'

          return (
            <h2 key={index} className={className}>
              {renderInline(block.text)}
            </h2>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-zinc-200">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-zinc-700 pl-4 italic text-zinc-300"
            >
              {renderInline(block.text)}
            </blockquote>
          )
        }

        if (block.type === 'code') {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-6 text-zinc-200"
            >
              <code>{block.code}</code>
            </pre>
          )
        }

        return (
          <p key={index} className="text-zinc-200">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}
