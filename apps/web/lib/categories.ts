export const CATEGORIES = [
  { slug: 'coding',        label: 'Coding',                   description: 'Programming, code review, refactoring, and software development prompts.' },
  { slug: 'architecture',  label: 'Architecture & Design',    description: 'System design, data modeling, and technical architecture prompts.' },
  { slug: 'debugging',     label: 'Debugging',                description: 'Diagnosing errors, tracing bugs, and root cause analysis prompts.' },
  { slug: 'devops',        label: 'DevOps & Infrastructure',  description: 'CI/CD, containers, cloud, and infrastructure automation prompts.' },
  { slug: 'startup',       label: 'Startup & Product',        description: 'Product strategy, user research, and startup execution prompts.' },
  { slug: 'writing',       label: 'Writing for Devs',         description: 'Docs, READMEs, specs, and technical writing prompts.' },
  { slug: 'automation',    label: 'Automation & Scripting',   description: 'Scripting, workflow automation, and tooling prompts.' },
  { slug: 'business',      label: 'Business & GTM',           description: 'Sales, marketing, pricing, and go-to-market prompts.' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug)

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null
}

export const AI_MODELS = [
  'Claude 3.7',
  'Claude 3.5 Sonnet',
  'GPT-4o',
  'o3',
  'Gemini 2.0 Flash',
  'Gemini 1.5 Pro',
  'Llama 3.3',
  'Deepseek R1',
] as const
