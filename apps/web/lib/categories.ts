export const CATEGORIES = [
  {
    slug: 'agents-md',
    label: 'agents.md',
    description:
      'Setup prompts and steering instructions meant to live in agents.md files for coding agents.',
  },
  {
    slug: 'claude-md',
    label: 'claude.md',
    description:
      'Claude-specific setup prompts, repo instructions, and reusable guidance for claude.md files.',
  },
  {
    slug: 'system-prompts',
    label: 'Other System Prompts',
    description:
      'Other system-level prompts, bootstrap instructions, and reusable steering context for AI tools.',
  },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug)

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null
}

export function getCategoryLabel(slug: string) {
  return getCategoryBySlug(slug)?.label ?? slug
}
