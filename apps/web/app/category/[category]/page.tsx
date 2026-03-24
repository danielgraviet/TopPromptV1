import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PromptCard } from '@/components/prompt-card'
import { CATEGORY_SLUGS, getCategoryBySlug } from '@/lib/categories'
import { getServerCaller } from '@/server/caller'

export const revalidate = 600

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const category = getCategoryBySlug(params.category)
  if (!category) return {}
  return {
    title: `${category.label} Prompts`,
    description: `Discover reusable ${category.label} setup prompts. ${category.description}`,
    alternates: {
      canonical: `https://topprompt.io/category/${params.category}`,
    },
  }
}

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ category: slug }))
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategoryBySlug(params.category)
  if (!category) notFound()

  const caller = await getServerCaller()
  const prompts = await caller.prompts.byCategory({ category: params.category, limit: 20 })

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">{category.label}</h1>
        <p className="text-zinc-400">{category.description}</p>
      </div>

      {prompts.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">No prompts in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </main>
  )
}
