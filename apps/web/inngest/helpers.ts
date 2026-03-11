/**
 * Heuristic extraction of the actual prompt text from a Reddit post body.
 * Looks for code blocks, quoted sections, or lines starting with "Prompt:".
 * Returns null if no prompt-like content found.
 */
export function extractPromptFromPost(text: string): string | null {
  if (!text || text.length < 20) return null

  // Try fenced code block first
  const codeBlock = text.match(/```[\s\S]*?```/)
  if (codeBlock) return codeBlock[0].replace(/```/g, '').trim()

  // Try a line starting with "Prompt:" or "System prompt:"
  const promptLine = text.match(/(?:system\s+)?prompt\s*[:：]\s*([\s\S]+?)(?:\n\n|$)/i)
  if (promptLine) return promptLine[1].trim()

  // Try blockquote (Reddit > prefix)
  const blockquote = text.match(/^>(.+)/m)
  if (blockquote) return blockquote[1].trim()

  // Fall back to the full text if it's long enough to be a prompt
  if (text.length >= 100) return text.slice(0, 20000)

  return null
}

const CATEGORY_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  { slug: 'coding',        keywords: ['code', 'programming', 'function', 'typescript', 'python', 'javascript', 'refactor', 'review'] },
  { slug: 'debugging',     keywords: ['debug', 'error', 'bug', 'fix', 'trace', 'stack trace', 'exception'] },
  { slug: 'devops',        keywords: ['deploy', 'docker', 'kubernetes', 'ci/cd', 'terraform', 'cloud', 'aws', 'infra'] },
  { slug: 'architecture',  keywords: ['system design', 'architecture', 'schema', 'database', 'microservice', 'api design'] },
  { slug: 'startup',       keywords: ['startup', 'product', 'mvp', 'roadmap', 'user research', 'founder'] },
  { slug: 'writing',       keywords: ['readme', 'docs', 'documentation', 'spec', 'technical writing', 'prd'] },
  { slug: 'automation',    keywords: ['automate', 'script', 'workflow', 'automation', 'bash', 'cron'] },
  { slug: 'business',      keywords: ['sales', 'marketing', 'gtm', 'pricing', 'pitch', 'copywriting'] },
]

/**
 * Infers a category slug from prompt title + body text using keyword matching.
 * Falls back to 'coding' if nothing matches.
 */
export function inferCategory(title: string, body: string): string {
  const combined = `${title} ${body}`.toLowerCase()

  for (const { slug, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => combined.includes(kw))) return slug
  }

  return 'coding'
}
