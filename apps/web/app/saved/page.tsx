import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getSavedPrompts } from '@toprompt/db/queries'
import { PromptCard } from '@/components/prompt-card'

export default async function SavedPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const prompts = await getSavedPrompts(session.user.id as string)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-white">Saved Prompts</h1>

      {prompts.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">
          No saved prompts yet. Hit the bookmark icon on any prompt to save it.
        </p>
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
